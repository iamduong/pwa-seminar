from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=6000)


class AdvisorRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    target: Literal["poi", "menu"]
    description: str = Field(min_length=1, max_length=4000)
    message: str = Field(min_length=1, max_length=2000)
    history: list[ConversationMessage] = Field(default_factory=list, max_length=12)


class AdvisorUsage(BaseModel):
    usage_date: date
    usage_count: int
    daily_limit: int
    remaining: int


class AdvisorReply(BaseModel):
    answer: str
    usage: AdvisorUsage
