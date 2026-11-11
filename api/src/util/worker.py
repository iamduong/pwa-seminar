import asyncio
from datetime import UTC, datetime
from uuid import UUID

from model.poi_localization_model import AudioStatus as LocalizationAudioStatus
from model.poi_localization_model import PoiLocalizationModel
from model.poi_model import AudioStatus as PoiAudioStatus
from model.poi_model import PoiModel
from model.poi_task_event_model import PoiTaskEventModel
from model.poi_task_model import PoiTaskModel
from model.owner_notification_model import OwnerNotificationType
from repository.audit_log_repository import AuditLogRepository
from repository.owner_notification_repository import OwnerNotificationRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload
from service.content_dataset_version_service import ContentDatasetVersionService
from util.audio import AudioGenerationError, ensure_audio_directory, generate_audio
from util.translator import TranslationError, translate_poi

POLL_INTERVAL_SECONDS = 2


def _event(task_id: UUID, message: str, language: str | None = None) -> PoiTaskEventModel:
    return PoiTaskEventModel(task_id=task_id, message=message, language=language, started_at=datetime.now(UTC))


def _task_query():
    return select(PoiTaskModel).options(
        selectinload(PoiTaskModel.events), selectinload(PoiTaskModel.processes)
    )


async def process_worker(
    session_factory: async_sessionmaker[AsyncSession], stop_event: asyncio.Event
) -> None:
    print("PostgreSQL POI worker started")
    await ensure_audio_directory()
    async with session_factory() as session:
        await _recover_tasks(session)

    while not stop_event.is_set():
        task_id = await _claim_task(session_factory)
        if task_id is None:
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=POLL_INTERVAL_SECONDS)
            except TimeoutError:
                pass
            continue
        try:
            async with session_factory() as session:
                task = await _get_task(session, task_id)
                if task is None:
                    continue
                poi = await session.get(PoiModel, task.poi_id)
                if poi is None or poi.deleted_at is not None:
                    raise ValueError(f"Không tìm thấy POI {task.poi_id}")
                await process_poi_task(session, task, poi, stop_event)
        except Exception as error:
            print(f"Không thể xử lý task {task_id}: {error}")
            async with session_factory() as session:
                await _retry_or_fail(session, task_id, f"Xử lý task thất bại: {error}")
    print("PostgreSQL POI worker stopped")


async def _claim_task(session_factory: async_sessionmaker[AsyncSession]) -> UUID | None:
    async with session_factory() as session:
        task = (
            await session.scalars(
                _task_query()
                .where(PoiTaskModel.status == "queued", PoiTaskModel.deleted_at.is_(None))
                .order_by(PoiTaskModel.created_at, PoiTaskModel.id)
                .with_for_update(skip_locked=True)
                .limit(1)
            )
        ).first()
        if task is None:
            return None
        task.status = "running"
        task.events.append(_event(task.id, "Khởi động tiến trình xử lý POI"))
        await session.commit()
        return task.id


async def _get_task(session: AsyncSession, task_id: UUID) -> PoiTaskModel | None:
    return (
        await session.scalars(
            _task_query().where(PoiTaskModel.id == task_id, PoiTaskModel.deleted_at.is_(None))
        )
    ).one_or_none()


async def process_poi_task(
    session: AsyncSession, task: PoiTaskModel, poi: PoiModel, stop_event: asyncio.Event
) -> None:
    total_steps = max(len(task.target_languages) * 2, 1)
    completed_steps = _count_completed_steps(task)
    has_error = False

    for language in task.target_languages:
        if stop_event.is_set():
            task.status, task.step_language = "queued", None
            task.events.append(_event(task.id, "Worker dừng; task được đưa lại vào hàng đợi", language))
            await session.commit()
            return

        process = next((item for item in task.processes if item.language == language), None)
        if process is None:
            has_error = True
            task.events.append(_event(task.id, f"Không tìm thấy process cho ngôn ngữ {language}", language))
            await session.commit()
            continue

        localization = await _find_localization(session, poi.id, language)
        translated: dict[str, str] | None = None
        if process.translation_status == "done" and localization:
            translated = {"category": localization.category, "name": localization.name, "description": localization.description}
        elif process.translation_status == "done":
            process.translation_status = "pending"
            completed_steps = max(completed_steps - 1, 0)

        if process.translation_status != "done":
            task.step_language = language
            task.events.append(_event(task.id, "Bắt đầu dịch nội dung", language))
            await session.commit()
            try:
                translated = await translate_poi(poi, language)
                localization = localization or PoiLocalizationModel(
                    poi_id=poi.id, lang=language, category=translated["category"],
                    name=translated["name"], description=translated["description"]
                )
                localization.category = translated["category"]
                localization.name = translated["name"]
                localization.description = translated["description"]
                localization.audio_status = LocalizationAudioStatus.PROCESSING.value
                session.add(localization)
                process.translation_status, process.error_message = "done", None
                completed_steps += 1
                task.events.append(_event(task.id, "Dịch nội dung thành công", language))
            except TranslationError as error:
                has_error = True
                process.translation_status = process.audio_status = "failed"
                process.error_message = str(error)
                task.events.append(_event(task.id, f"Dịch nội dung thất bại: {error}", language))
                await _save_progress(session, task, completed_steps, total_steps)
                continue
            await _save_progress(session, task, completed_steps, total_steps)

        if process.audio_status == "done":
            continue
        try:
            assert translated is not None
            audio_url, was_created = await generate_audio(poi.description, translated["description"], language)
            process.audio_status, process.audio_url, process.error_message = "done", audio_url, None
            completed_steps += 1
            if localization is not None:
                localization.audio_url = audio_url
                localization.audio_status = LocalizationAudioStatus.READY.value
            action = "Tạo" if was_created else "Tái sử dụng"
            task.events.append(_event(task.id, f"{action} file âm thanh thành công: {audio_url}", language))
        except AudioGenerationError as error:
            has_error = True
            completed_steps += 1
            process.audio_status, process.error_message = "failed", str(error)
            if localization is not None:
                localization.audio_status = LocalizationAudioStatus.FAILED.value
            task.events.append(_event(task.id, f"Tạo âm thanh thất bại: {error}", language))
        await _save_progress(session, task, completed_steps, total_steps)

    if has_error and task.retry_count < task.max_retries:
        _reset_failed_processes(task)
        task.retry_count += 1
        task.status, task.step_language = "queued", None
        task.progress_percent = min(_count_completed_steps(task) * 100 // total_steps, 100)
        task.events.append(_event(task.id, f"Tự động retry lần {task.retry_count}/{task.max_retries}"))
        poi.audio_status = PoiAudioStatus.PROCESSING.value
        await session.commit()
        return

    task.status = "failed" if has_error else "done"
    task.progress_percent, task.step_language = 100, None
    poi.audio_status = PoiAudioStatus.FAILED.value if has_error else PoiAudioStatus.READY.value
    if not has_error and task.activation_requested:
        poi.is_active = True
    task.events.append(_event(task.id, "Xử lý POI thất bại" if has_error else "Xử lý POI hoàn tất"))
    if not has_error:
        if poi.owner_id is not None:
            await OwnerNotificationRepository(session).create_once(
                owner_id=poi.owner_id,
                notification_type=OwnerNotificationType.POI_PROCESSING_COMPLETED.value,
                title="POI đã xử lý hoàn tất",
                message=f"POI '{poi.name}' đã có đầy đủ bản dịch và âm thanh.",
                resource_type="poi_task",
                resource_id=task.id,
                commit=False,
            )
        await AuditLogRepository(session).create(
            actor_user_id=None,
            action="poi_task.complete",
            resource_type="poi_task",
            resource_id=task.id,
            description=f"Hoàn tất bản dịch và âm thanh cho POI '{poi.name}'",
            metadata={"poi_id": str(poi.id)},
            commit=False,
        )
    if poi.is_active:
        # Publish the POI changes and the new snapshot ETag together, only
        # after translations and audio are complete.
        await ContentDatasetVersionService(session).rotate_poi_etag()
    else:
        await session.commit()


async def _find_localization(session: AsyncSession, poi_id: UUID, language: str):
    return (
        await session.scalars(
            select(PoiLocalizationModel).where(
                PoiLocalizationModel.poi_id == poi_id,
                PoiLocalizationModel.lang == language,
                PoiLocalizationModel.deleted_at.is_(None),
            )
        )
    ).first()


def _count_completed_steps(task: PoiTaskModel) -> int:
    return sum(x.translation_status == "done" for x in task.processes) + sum(x.audio_status == "done" for x in task.processes)


def _reset_failed_processes(task: PoiTaskModel) -> None:
    for process in task.processes:
        if process.translation_status == "failed":
            process.translation_status = "pending"
        if process.audio_status == "failed":
            process.audio_status = "pending"
        process.error_message = None


async def _save_progress(session, task, completed_steps, total_steps) -> None:
    task.progress_percent = min(completed_steps * 100 // total_steps, 100)
    await session.commit()


async def _retry_or_fail(session: AsyncSession, task_id: UUID, message: str) -> None:
    task = await _get_task(session, task_id)
    if task is None:
        return
    task.events.append(_event(task.id, message))
    if task.retry_count < task.max_retries:
        _reset_failed_processes(task)
        task.retry_count += 1
        task.status = "queued"
        task.events.append(_event(task.id, f"Tự động retry lần {task.retry_count}/{task.max_retries}"))
    else:
        task.status = "failed"
    task.step_language = None
    await session.commit()


async def _recover_tasks(session: AsyncSession) -> None:
    tasks = list((await session.scalars(_task_query().where(PoiTaskModel.status.in_(["running", "failed"]), PoiTaskModel.deleted_at.is_(None)))).all())
    for task in tasks:
        if task.status == "failed" and task.retry_count >= task.max_retries:
            continue
        _reset_failed_processes(task)
        if task.status == "failed":
            task.retry_count += 1
        task.status, task.step_language = "queued", None
        task.events.append(_event(task.id, "Khôi phục task bị gián đoạn"))
    await session.commit()
