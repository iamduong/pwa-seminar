from pydantic import BaseModel


class ViewAudioPlayCount(BaseModel):
    poi_id: str
    audio_listen_count: int
