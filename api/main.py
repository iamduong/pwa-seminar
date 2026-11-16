import asyncio
from contextlib import asynccontextmanager

from core.api_response import ApiResponse
from core.provider.postgres import SessionFactory, close_postgres, connect_postgres
from core.provider.redis import close_redis, connect_redis
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from service.analytics_event_service import AnalyticsEventService
from service.content_dataset_version_service import ContentDatasetVersionService
from starlette.exceptions import HTTPException as StarletteHTTPException
from util.audio import AUDIO_DIRECTORY
from util.image import IMAGE_DIRECTORY
from util.worker import process_worker
from util.menu_item_worker import process_menu_item_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_postgres()
    await connect_redis()

    async with SessionFactory() as database:
        await ContentDatasetVersionService(database).initialize()
        await AnalyticsEventService(database).disconnect_all_visitors()

    stop_event = asyncio.Event()
    worker_task = asyncio.create_task(process_worker(SessionFactory, stop_event))
    menu_worker_task = asyncio.create_task(process_menu_item_worker(SessionFactory, stop_event))

    try:
        yield
    finally:
        stop_event.set()
        await asyncio.gather(worker_task, menu_worker_task)
        await close_redis()
        await close_postgres()


origins = [
    "http://localhost:5173",
]

app = FastAPI(title="PWA Seminar API", lifespan=lifespan)
app.mount(
    "/resource/audio",
    StaticFiles(directory=AUDIO_DIRECTORY, check_dir=False),
    name="audio",
)
app.mount(
    "/resource/images",
    StaticFiles(directory=IMAGE_DIRECTORY, check_dir=False),
    name="images",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    is_string_detail = isinstance(exc.detail, str)
    response = ApiResponse[None](
        success=False,
        message=exc.detail if is_string_detail else "Yêu cầu không hợp lệ",
        errors=None if is_string_detail else [{"detail": exc.detail}],
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=response.model_dump(mode="json"),
        headers=exc.headers,
    )


# Validation exception
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = [
        {
            "field": ".".join(str(part) for part in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]
    response = ApiResponse[None](
        success=False,
        message="Dữ liệu đầu vào không hợp lệ",
        errors=errors,
    )

    return JSONResponse(
        status_code=422,
        content=response.model_dump(mode="json"),
    )


# Fallback server exception
@app.exception_handler(Exception)
async def unexpected_exception_handler(
    _request: Request,
    _exc: Exception,
) -> JSONResponse:
    response = ApiResponse[None](
        success=False,
        message="Đã xảy ra lỗi hệ thống",
    )

    return JSONResponse(
        status_code=500,
        content=response.model_dump(mode="json"),
    )


from router.admin_user_router import router as admin_user_router
from router.authorize_router import router as authorize_router
from router.dashboard_statistics_router import router as dashboard_statistics_router
from router.menu_item_router import router as menu_item_router
from router.poi_owner_registration_router import router as poi_owner_registration_router
from router.poi_registration_router import router as poi_registration_router
from router.poi_router import router as poi_router
from router.public_router import router as public_router
from router.role_router import router as role_router
from router.poi_task_router import router as poi_task_router
from router.audit_log_router import router as audit_log_router
from router.ai_advisor_router import router as ai_advisor_router
from router.owner_notification_router import router as owner_notification_router
from router.presence_router import router as presence_router
from router.tour_router import router as tour_router
from router.transaction_log_router import router as transaction_log_router

app.include_router(public_router)
app.include_router(authorize_router)
app.include_router(dashboard_statistics_router)
app.include_router(poi_owner_registration_router)
app.include_router(role_router)
app.include_router(poi_registration_router)
app.include_router(poi_router)
app.include_router(admin_user_router)
app.include_router(menu_item_router)
app.include_router(poi_task_router)
app.include_router(presence_router)
app.include_router(owner_notification_router)
app.include_router(audit_log_router)
app.include_router(ai_advisor_router)
app.include_router(tour_router)
app.include_router(transaction_log_router)
