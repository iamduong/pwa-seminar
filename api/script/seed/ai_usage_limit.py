from datetime import datetime, timedelta, timezone

from core.setting import get_setting
from model.admin_user_model import AdminUserModel
from model.ai_usage_limit_model import AiUsageLimitModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


VIETNAM_TIMEZONE = timezone(timedelta(hours=7))


async def init_ai_usage_limits(
    session: AsyncSession,
    users: dict[str, AdminUserModel],
) -> list[AiUsageLimitModel]:
    usage_date = datetime.now(VIETNAM_TIMEZONE).date()
    daily_limit = max(0, get_setting().AI_DAILY_LIMIT)
    result: list[AiUsageLimitModel] = []

    for user in users.values():
        usage = (
            await session.scalars(
                select(AiUsageLimitModel).where(
                    AiUsageLimitModel.user_id == user.id,
                    AiUsageLimitModel.usage_date == usage_date,
                )
            )
        ).one_or_none()
        if usage is None:
            usage = AiUsageLimitModel(
                user_id=user.id,
                usage_date=usage_date,
                usage_count=0,
                daily_limit=daily_limit,
            )
            session.add(usage)
        else:
            usage.usage_count = 0
            usage.daily_limit = daily_limit
            usage.deleted_at = None
        result.append(usage)

    await session.flush()
    print(f"ai_usage_limits: {len(result)} fixtures ready")
    return result
