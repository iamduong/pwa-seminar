from core.dependency import PostgresDB
from model.poi_task_process_model import PoiTaskProcessModel


class PoiTaskProcessRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def insert_many(self, processes: list[PoiTaskProcessModel]):
        self.context.add_all(processes)
        await self.context.flush()
        return processes
