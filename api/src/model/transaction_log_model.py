from datetime import datetime
from decimal import Decimal

from model.base.base import Base
from sqlalchemy import CheckConstraint, DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class TransactionLogModel(Base):
    __tablename__ = "transaction_logs"
    __table_args__ = (
        CheckConstraint(
            "amount >= 0",
            name="ck_transaction_log_amount_non_negative",
        ),
    )

    transaction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    reference_code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )
