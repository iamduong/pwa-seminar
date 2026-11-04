import asyncio

from deep_translator import MyMemoryTranslator
from deep_translator.exceptions import (
    BaseError,
    RequestError,
    TooManyRequests,
)
from model.poi_model import PoiModel
from requests import RequestException

SOURCE_LANGUAGE = "vi-VN"


class TranslationError(RuntimeError):
    pass


async def translate(text: str, source: str, target: str = "en") -> str:
    try:
        translated = await asyncio.to_thread(
            MyMemoryTranslator(source=source, target=target).translate,
            text,
        )
    except (
        BaseError,
        RequestError,
        TooManyRequests,
        RequestException,
        KeyError,
        StopIteration,
        TypeError,
        ValueError,
    ) as error:
        raise TranslationError(str(error)) from error

    if not isinstance(translated, str) or not translated:
        raise TranslationError("Dịch vụ không trả về nội dung bản dịch")
    return translated


async def translate_poi(poi: PoiModel, language: str) -> dict[str, str]:
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
