import asyncio
import hashlib
from datetime import UTC, datetime
from pathlib import Path

import edge_tts
from model.poi_localization_model import AudioStatus as LocalizationAudioStatus
from model.poi_model import AudioStatus as PoiAudioStatus
from model.poi_model import PoiModel
from model.poi_task_model import Event, PoiTaskModel, PoiTaskStatus, ProcessStatus
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase
from util.resource import MY_MEMORY_VOICES
from util.translator import translate

POLL_INTERVAL_SECONDS = 2
SOURCE_LANGUAGE = "vi-VN"
AUDIO_DIRECTORY = Path(__file__).resolve().parents[2] / "static" / "audio"
AUDIO_URL_PREFIX = "/static/audio"


async def process_worker(database: AsyncDatabase, stop_event: asyncio.Event):
    print("Worker started")
    poi_task_collection = database["poi_task"]
    poi_collection = database["poi"]
    localization_collection = database["poi_localization"]

    await asyncio.to_thread(AUDIO_DIRECTORY.mkdir, parents=True, exist_ok=True)

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
                await asyncio.wait_for(
                    stop_event.wait(), timeout=POLL_INTERVAL_SECONDS
                )
            except TimeoutError:
                pass
            continue

        try:
            poi_task = PoiTaskModel.model_validate(poi_task_document)
            poi_document = await poi_collection.find_one({"_id": poi_task.poi_id})
            if poi_document is None:
                raise ValueError(f"Không tìm thấy POI {poi_task.poi_id}")

            poi = PoiModel.model_validate(poi_document)
            await process_poi_task(
                poi_task,
                poi,
                poi_task_collection,
                poi_collection,
                localization_collection,
                stop_event,
            )
        except Exception as error:
            print(f"Không thể xử lý task {poi_task_document.get('_id')}: {error}")
            await poi_task_collection.update_one(
                {"_id": poi_task_document["_id"]},
                {
                    "$set": {
                        "status": PoiTaskStatus.FAILED.value,
                        "updated_at": datetime.now(UTC),
                    },
                    "$push": {"events": _event(f"Xử lý task thất bại: {error}")},
                },
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
    completed_steps = 0
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
            translated = await process_translation(poi, language)
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
        except Exception as error:
            has_error = True
            completed_steps += 2
            process.translation_status = ProcessStatus.FAILED
            process.audio_status = ProcessStatus.FAILED
            process.error_message = str(error)
            await _append_event(
                task_collection,
                task.id,
                f"Dịch nội dung thất bại: {error}",
                language,
            )
            await _save_progress(
                task_collection, task, completed_steps, total_steps
            )
            continue

        await _save_progress(task_collection, task, completed_steps, total_steps)

        try:
            audio_url, was_created = await process_audio(
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
        except Exception as error:
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


async def process_translation(poi: PoiModel, language: str) -> dict[str, str]:
    if language == SOURCE_LANGUAGE:
        return {
            "category": poi.category_name,
            "name": poi.name,
            "description": poi.description,
        }

    return {
        "category": await translate(poi.category_name, SOURCE_LANGUAGE, language),
        "name": await translate(poi.name, SOURCE_LANGUAGE, language),
        "description": await translate(poi.description, SOURCE_LANGUAGE, language),
    }


async def process_audio(
    source_description: str,
    translated_description: str,
    language: str,
) -> tuple[str, bool]:
    voice = MY_MEMORY_VOICES.get(language)
    if voice is None:
        raise ValueError(f"Chưa cấu hình giọng đọc cho ngôn ngữ {language}")

    audio_hash = hashlib.md5(
        f"{source_description}:{language}".encode("utf-8")
    ).hexdigest()
    audio_path = AUDIO_DIRECTORY / f"{audio_hash}.mp3"
    audio_url = f"{AUDIO_URL_PREFIX}/{audio_path.name}"

    if await asyncio.to_thread(_is_valid_audio_file, audio_path):
        return audio_url, False

    temporary_path = audio_path.with_suffix(".tmp")
    try:
        communicate = edge_tts.Communicate(
            text=translated_description,
            voice=voice,
        )
        await communicate.save(str(temporary_path))
        await asyncio.to_thread(temporary_path.replace, audio_path)
    except Exception:
        if temporary_path.exists():
            temporary_path.unlink()
        raise

    return audio_url, True


def _is_valid_audio_file(path: Path) -> bool:
    return path.is_file() and path.stat().st_size > 0


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
