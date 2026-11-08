import asyncio
from datetime import UTC, datetime

from model.poi_localization_model import AudioStatus as LocalizationAudioStatus
from model.poi_model import AudioStatus as PoiAudioStatus
from model.poi_model import PoiModel
from model.poi_task_model import Event, PoiTaskModel, PoiTaskStatus, ProcessStatus
from pydantic import ValidationError
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError
from util.audio import AudioGenerationError, ensure_audio_directory, generate_audio
from util.translator import TranslationError, translate_poi

POLL_INTERVAL_SECONDS = 2


async def process_worker(database: AsyncDatabase, stop_event: asyncio.Event):
    print("Worker started")
    poi_task_collection = database["poi_task"]
    poi_collection = database["poi"]
    localization_collection = database["poi_localization"]

    await ensure_audio_directory()
    await _recover_interrupted_tasks(poi_task_collection)
    await _recover_retryable_failed_tasks(poi_task_collection)

    while not stop_event.is_set():
        started_at = datetime.now(UTC)
        poi_task_document = await poi_task_collection.find_one_and_update(
            {"status": PoiTaskStatus.QUEUED.value},
            {
                "$set": {
                    "status": PoiTaskStatus.RUNNING.value,
                    "updated_at": started_at,
                },
                "$push": {
                    "events": _event(
                        "Khởi động tiến trình xử lý POI",
                        started_at=started_at,
                    )
                },
            },
            return_document=ReturnDocument.AFTER,
        )

        if poi_task_document is None:
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=POLL_INTERVAL_SECONDS)
            except TimeoutError:
                pass
            continue

        try:
            poi_task = PoiTaskModel.model_validate(poi_task_document)
            poi_document = await poi_collection.find_one({"_id": poi_task.poi_id})
            if poi_document is None:
                raise ValueError(f"Không tìm thấy POI {poi_task.poi_id}")

            poi = PoiModel.model_validate(poi_document)
            print(f"Found poi_task {poi_task.id}")
            await process_poi_task(
                poi_task,
                poi,
                poi_task_collection,
                poi_collection,
                localization_collection,
                stop_event,
            )
            print(f"Done poi_task {poi_task.id}")
        except Exception as error:
            print(f"Không thể xử lý task {poi_task_document.get('_id')}: {error}")
            await _retry_or_fail_document(
                poi_task_collection,
                poi_task_document,
                f"Xử lý task thất bại: {error}",
            )

    print("Worker stopped")


async def process_poi_task(
    task: PoiTaskModel,
    poi: PoiModel,
    task_collection,
    poi_collection,
    localization_collection,
    stop_event: asyncio.Event,
) -> None:
    total_steps = max(len(task.target_languages) * 2, 1)
    completed_steps = _count_completed_steps(task)
    has_error = False

    for language in task.target_languages:
        if stop_event.is_set():
            await task_collection.update_one(
                {"_id": task.id},
                {
                    "$set": {
                        "status": PoiTaskStatus.QUEUED.value,
                        "step_language": None,
                        "updated_at": datetime.now(UTC),
                    },
                    "$push": {
                        "events": _event(
                            "Worker dừng; task được đưa lại vào hàng đợi",
                            language,
                        )
                    },
                },
            )
            return

        process = next(
            (item for item in task.processes if item.language == language), None
        )
        if process is None:
            has_error = True
            completed_steps += 2
            await _append_event(
                task_collection,
                task.id,
                f"Không tìm thấy process cho ngôn ngữ {language}",
                language,
            )
            continue

        if (
            process.translation_status == ProcessStatus.DONE
            and process.audio_status == ProcessStatus.DONE
        ):
            continue

        translated = None
        if process.translation_status == ProcessStatus.DONE:
            translated = await localization_collection.find_one(
                {"poi_id": poi.id, "lang": language, "deleted_at": None}
            )
            if translated is None:
                process.translation_status = ProcessStatus.PENDING
                completed_steps = max(completed_steps - 1, 0)

        if process.translation_status != ProcessStatus.DONE:
            await task_collection.update_one(
                {"_id": task.id},
                {
                    "$set": {
                        "step_language": language,
                        "updated_at": datetime.now(UTC),
                    },
                    "$push": {"events": _event("Bắt đầu dịch nội dung", language)},
                },
            )

            try:
                translated = await translate_poi(poi, language)
                process.translation_status = ProcessStatus.DONE
                process.error_message = None
                completed_steps += 1

                now = datetime.now(UTC)
                await localization_collection.update_one(
                    {"poi_id": poi.id, "lang": language},
                    {
                        "$set": {
                            **translated,
                            "audio_status": LocalizationAudioStatus.PROCESSING.value,
                            "updated_at": now,
                        },
                        "$setOnInsert": {
                            "poi_id": poi.id,
                            "lang": language,
                            "created_at": now,
                            "deleted_at": None,
                        },
                    },
                    upsert=True,
                )
                await _append_event(
                    task_collection,
                    task.id,
                    "Dịch nội dung thành công",
                    language,
                )
            except (PyMongoError, TranslationError) as error:
                has_error = True
                process.translation_status = ProcessStatus.FAILED
                process.audio_status = ProcessStatus.FAILED
                process.error_message = str(error)
                await _append_event(
                    task_collection,
                    task.id,
                    f"Dịch nội dung thất bại: {error}",
                    language,
                )
                await _save_progress(task_collection, task, completed_steps, total_steps)
                continue

            await _save_progress(task_collection, task, completed_steps, total_steps)

        if process.audio_status == ProcessStatus.DONE:
            continue

        try:
            audio_url, was_created = await generate_audio(
                poi.description,
                translated["description"],
                language,
            )
            process.audio_status = ProcessStatus.DONE
            process.audio_url = audio_url
            process.error_message = None
            completed_steps += 1

            await localization_collection.update_one(
                {"poi_id": poi.id, "lang": language},
                {
                    "$set": {
                        "audio_url": audio_url,
                        "audio_status": LocalizationAudioStatus.READY.value,
                        "updated_at": datetime.now(UTC),
                    }
                },
            )
            action = "Tạo" if was_created else "Tái sử dụng"
            await _append_event(
                task_collection,
                task.id,
                f"{action} file âm thanh thành công: {audio_url}",
                language,
            )
        except (AudioGenerationError, PyMongoError) as error:
            has_error = True
            completed_steps += 1
            process.audio_status = ProcessStatus.FAILED
            process.error_message = str(error)
            await localization_collection.update_one(
                {"poi_id": poi.id, "lang": language},
                {
                    "$set": {
                        "audio_status": LocalizationAudioStatus.FAILED.value,
                        "updated_at": datetime.now(UTC),
                    }
                },
            )
            await _append_event(
                task_collection,
                task.id,
                f"Tạo âm thanh thất bại: {error}",
                language,
            )

        await _save_progress(task_collection, task, completed_steps, total_steps)

    if has_error and task.retry_count < task.max_retries:
        await _queue_automatic_retry(
            task_collection,
            task,
            total_steps,
        )
        await poi_collection.update_one(
            {"_id": poi.id},
            {
                "$set": {
                    "audio_status": PoiAudioStatus.PROCESSING.value,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return

    final_status = PoiTaskStatus.FAILED if has_error else PoiTaskStatus.DONE
    poi_audio_status = PoiAudioStatus.FAILED if has_error else PoiAudioStatus.READY
    finished_at = datetime.now(UTC)

    await task_collection.update_one(
        {"_id": task.id},
        {
            "$set": {
                "status": final_status.value,
                "progress_percent": 100,
                "step_language": None,
                "updated_at": finished_at,
            },
            "$push": {
                "events": _event(
                    "Xử lý POI thất bại" if has_error else "Xử lý POI hoàn tất",
                    started_at=finished_at,
                )
            },
        },
    )

    poi_update = {
        "audio_status": poi_audio_status.value,
        "updated_at": finished_at,
    }
    if not has_error and task.activation_requested:
        poi_update["is_active"] = True
    await poi_collection.update_one({"_id": poi.id}, {"$set": poi_update})


def _count_completed_steps(task: PoiTaskModel) -> int:
    return sum(
        process.translation_status == ProcessStatus.DONE
        for process in task.processes
    ) + sum(
        process.audio_status == ProcessStatus.DONE
        for process in task.processes
    )


def _reset_failed_processes(task: PoiTaskModel) -> None:
    for process in task.processes:
        if process.translation_status == ProcessStatus.FAILED:
            process.translation_status = ProcessStatus.PENDING
        if process.audio_status == ProcessStatus.FAILED:
            process.audio_status = ProcessStatus.PENDING
        process.error_message = None


async def _queue_automatic_retry(
    task_collection,
    task: PoiTaskModel,
    total_steps: int,
) -> None:
    _reset_failed_processes(task)
    retry_count = task.retry_count + 1
    now = datetime.now(UTC)
    await task_collection.update_one(
        {"_id": task.id, "status": PoiTaskStatus.RUNNING.value},
        {
            "$set": {
                "status": PoiTaskStatus.QUEUED.value,
                "retry_count": retry_count,
                "step_language": None,
                "processes": [
                    process.model_dump(mode="json") for process in task.processes
                ],
                "progress_percent": min(
                    _count_completed_steps(task) * 100 // total_steps,
                    100,
                ),
                "updated_at": now,
            },
            "$push": {
                "events": _event(
                    f"Tự động retry lần {retry_count}/{task.max_retries}; "
                    "task được đưa lại vào hàng đợi",
                    started_at=now,
                )
            },
        },
    )


async def _retry_or_fail_document(
    task_collection,
    claimed_document: dict,
    error_message: str,
) -> None:
    current = await task_collection.find_one({"_id": claimed_document["_id"]})
    if current is None:
        return

    retry_count = int(current.get("retry_count", 0))
    max_retries = int(current.get("max_retries", 3))
    now = datetime.now(UTC)
    if retry_count < max_retries:
        processes = current.get("processes", [])
        for process in processes:
            if process.get("translation_status") == ProcessStatus.FAILED.value:
                process["translation_status"] = ProcessStatus.PENDING.value
            if process.get("audio_status") == ProcessStatus.FAILED.value:
                process["audio_status"] = ProcessStatus.PENDING.value
            process["error_message"] = None

        next_retry = retry_count + 1
        await task_collection.update_one(
            {"_id": current["_id"], "status": PoiTaskStatus.RUNNING.value},
            {
                "$set": {
                    "status": PoiTaskStatus.QUEUED.value,
                    "retry_count": next_retry,
                    "step_language": None,
                    "processes": processes,
                    "updated_at": now,
                },
                "$push": {
                    "events": {
                        "$each": [
                            _event(error_message, started_at=now),
                            _event(
                                f"Tự động retry lần {next_retry}/{max_retries}; "
                                "task được đưa lại vào hàng đợi",
                                started_at=now,
                            ),
                        ]
                    }
                },
            },
        )
        return

    await task_collection.update_one(
        {"_id": current["_id"], "status": PoiTaskStatus.RUNNING.value},
        {
            "$set": {
                "status": PoiTaskStatus.FAILED.value,
                "step_language": None,
                "updated_at": now,
            },
            "$push": {"events": _event(error_message, started_at=now)},
        },
    )


async def _recover_interrupted_tasks(task_collection) -> None:
    interrupted_tasks = await task_collection.find(
        {"status": PoiTaskStatus.RUNNING.value}
    ).to_list()
    for task in interrupted_tasks:
        now = datetime.now(UTC)
        await task_collection.update_one(
            {"_id": task["_id"], "status": PoiTaskStatus.RUNNING.value},
            {
                "$set": {
                    "status": PoiTaskStatus.QUEUED.value,
                    "step_language": None,
                    "updated_at": now,
                },
                "$push": {
                    "events": _event(
                        "Khôi phục task bị gián đoạn; task được đưa lại vào hàng đợi",
                        started_at=now,
                    )
                },
            },
        )


async def _recover_retryable_failed_tasks(task_collection) -> None:
    failed_tasks = await task_collection.find(
        {"status": PoiTaskStatus.FAILED.value}
    ).to_list()
    for document in failed_tasks:
        try:
            task = PoiTaskModel.model_validate(document)
        except ValidationError:
            continue
        if task.retry_count >= task.max_retries:
            continue

        _reset_failed_processes(task)
        retry_count = task.retry_count + 1
        total_steps = max(len(task.target_languages) * 2, 1)
        now = datetime.now(UTC)
        await task_collection.update_one(
            {"_id": task.id, "status": PoiTaskStatus.FAILED.value},
            {
                "$set": {
                    "status": PoiTaskStatus.QUEUED.value,
                    "retry_count": retry_count,
                    "step_language": None,
                    "processes": [
                        process.model_dump(mode="json")
                        for process in task.processes
                    ],
                    "progress_percent": min(
                        _count_completed_steps(task) * 100 // total_steps,
                        100,
                    ),
                    "updated_at": now,
                },
                "$push": {
                    "events": _event(
                        f"Tự động retry lần {retry_count}/{task.max_retries}; "
                        "task được đưa lại vào hàng đợi",
                        started_at=now,
                    )
                },
            },
        )


def _event(
    message: str,
    language: str | None = None,
    started_at: datetime | None = None,
) -> dict:
    return Event(
        message=message,
        language=language,
        started_at=started_at or datetime.now(UTC),
    ).model_dump()


async def _append_event(
    task_collection,
    task_id,
    message: str,
    language: str | None = None,
) -> None:
    await task_collection.update_one(
        {"_id": task_id},
        {
            "$set": {"updated_at": datetime.now(UTC)},
            "$push": {"events": _event(message, language)},
        },
    )


async def _save_progress(
    task_collection,
    task: PoiTaskModel,
    completed_steps: int,
    total_steps: int,
) -> None:
    await task_collection.update_one(
        {"_id": task.id},
        {
            "$set": {
                "processes": [
                    process.model_dump(mode="json") for process in task.processes
                ],
                "progress_percent": min(completed_steps * 100 // total_steps, 100),
                "updated_at": datetime.now(UTC),
            }
        },
    )
