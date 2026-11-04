import asyncio
from contextlib import asynccontextmanager

from bson.errors import InvalidId
from core.api_response import ApiResponse
from core.provider.mongo import close_mongo, connect_mongo, get_mongo
from core.provider.redis import close_redis, connect_redis
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from util.audio import AUDIO_DIRECTORY
from util.worker import process_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()

    database = get_mongo()

    stop_event = asyncio.Event()
    worker_task = asyncio.create_task(process_worker(database, stop_event))

    try:
        yield
    finally:
        stop_event.set()
        try:
            await worker_task
        finally:
            await close_mongo()
            await close_redis()


origins = [
    "http://localhost:5173",
]

app = FastAPI(title="PWA Seminar API", lifespan=lifespan)
app.mount(
    "/resource/audio",
    StaticFiles(directory=AUDIO_DIRECTORY, check_dir=False),
    name="audio",
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


# Validation ObjectId exception
@app.exception_handler(InvalidId)
async def bson_id_exception_handler(_request: Request, _exc: InvalidId) -> JSONResponse:
    response = ApiResponse[None](
        success=False, message="Dữ liệu đầu vào không chính xác"
    )

    return JSONResponse(status_code=400, content=response.model_dump(mode="json"))


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


from router.authorize_router import router as authorize_router
from router.poi_owner_registration_router import router as poi_owner_registration_router
from router.poi_registration_router import router as poi_registration_router
from router.public_router import router as public_router
<<<<<<< HEAD
from router.role_router import router as role_router
=======
from router.admin_user_router import router as admin_user_router
>>>>>>> 8e999b5 (feat: add admin user management table)

app.include_router(public_router)
app.include_router(authorize_router)
app.include_router(poi_owner_registration_router)
<<<<<<< HEAD
app.include_router(role_router)
app.include_router(poi_registration_router)
=======
app.include_router(admin_user_router)
>>>>>>> 8e999b5 (feat: add admin user management table)
