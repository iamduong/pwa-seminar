import asyncio

from deep_translator import MyMemoryTranslator


async def translate(text: str, source: str, target: str = "en") -> str:
    return await asyncio.to_thread(
        MyMemoryTranslator(source=source, target=target).translate,
        text,
    )
