import asyncio
import hashlib
from contextlib import suppress
from pathlib import Path
from resource.config import AUDIO_DIRECTORY, MY_MEMORY_VOICES

import edge_tts
from aiohttp import ClientError
from edge_tts.exceptions import EdgeTTSException

AUDIO_URL_PREFIX = "/resource/audio"


class AudioGenerationError(RuntimeError):
    pass


async def ensure_audio_directory() -> None:
    await asyncio.to_thread(AUDIO_DIRECTORY.mkdir, parents=True, exist_ok=True)


async def generate_audio(
    source_description: str,
    translated_description: str,
    language: str,
) -> tuple[str, bool]:
    voice = MY_MEMORY_VOICES.get(language)
    if voice is None:
        raise AudioGenerationError(f"Chưa cấu hình giọng đọc cho ngôn ngữ {language}")

    audio_hash = hashlib.md5(
        f"{source_description}:{language}".encode(),
        usedforsecurity=False,
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
    except (EdgeTTSException, ClientError, OSError, TimeoutError, ValueError) as error:
        with suppress(OSError):
            temporary_path.unlink(missing_ok=True)
        raise AudioGenerationError(str(error)) from error

    return audio_url, True


def _is_valid_audio_file(path: Path) -> bool:
    return path.is_file() and path.stat().st_size > 0
