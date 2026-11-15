from typing import Annotated
from uuid import UUID

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, validate_session
from fastapi import APIRouter, Depends
from schema.ai_advisor_schema import AdvisorReply, AdvisorRequest, AdvisorUsage
from service.ai_advisor_service import AiAdvisorService, check_advisor_access

router = APIRouter(prefix="/ai-advisor", tags=["AI Advisor"])
Session = Annotated[AccessTokenPayload, Depends(validate_session)]
Service = Annotated[AiAdvisorService, Depends()]


@router.get("/usage")
async def usage(session: Session, service: Service) -> ApiResponse[AdvisorUsage]:
    check_advisor_access(session)
    return ApiResponse(success=True, message="Hạn mức AI hôm nay", data=await service.usage(UUID(session.sub)))


@router.post("/chat")
async def chat(body: AdvisorRequest, session: Session, service: Service) -> ApiResponse[AdvisorReply]:
    check_advisor_access(session)
    return ApiResponse(success=True, message="Đã tạo gợi ý nội dung", data=await service.advise(UUID(session.sub), body))
