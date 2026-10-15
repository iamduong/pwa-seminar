from contextlib import asynccontextmanager

from bson.errors import InvalidId
from core.api_response import ApiResponse
from core.provider.mongo import close_mongo, connect_mongo
from core.provider.redis import close_redis, connect_redis
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from router.admin_router import router as admin_router
from router.auth_router import router as auth_router
from router.owner_router import router as owner_router
from router.poi_category_router import router as poi_category_router
from starlette.exceptions import HTTPException as StarletteHTTPException


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()

    yield   

    await close_mongo()
    await close_redis()

app = FastAPI(
    title="PWA Seminar API",
    lifespan=lifespan
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
async def bson_id_exception_handler(
    _request: Request,
    _exc: InvalidId
) -> JSONResponse:
    response = ApiResponse[None](
        success=False,
        message="Dữ liệu đầu vào không chính xác"
    )

    return JSONResponse(
        status_code=400,
        content=response.model_dump(mode="json")
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

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(owner_router)
app.include_router(poi_category_router)
