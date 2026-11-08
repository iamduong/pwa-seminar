from core.dependency import PostgresDB
from model.poi_task_event_model import PoiTaskEventModel


class PoiTaskEventRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def insert(self, event: PoiTaskEventModel):
        self.context.add(event)
        await self.context.flush()
        return event
