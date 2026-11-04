from pathlib import Path

RESOURCE_DIRECTORY = Path(__file__).resolve().parent
AUDIO_DIRECTORY = RESOURCE_DIRECTORY / "audio"
DOC_DIRECTORY = RESOURCE_DIRECTORY / "doc"

DEFAULT_LANGUAGES = ["vi", "en"]

MY_MEMORY_LANGUAGES = ["vi-VN", "en-US", "zh-CN", "ja-JP", "ko-KR"]

MY_MEMORY_VOICES = {
    "vi-VN": "vi-VN-HoaiMyNeural",
    "en-US": "en-US-JennyNeural",
    "zh-CN": "zh-CN-XiaoxiaoNeural",
    "ja-JP": "ja-JP-NanamiNeural",
    "ko-KR": "ko-KR-SunHiNeural",
}
