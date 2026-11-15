"""Manually evaluate the local model without spending account quota."""
import sys
from pathlib import Path
from time import monotonic

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from schema.ai_advisor_schema import AdvisorRequest
from service.ai_advisor_service import generate_answer, REFUSAL

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    source = "Quán cơm gà quận tư. Phục vụ cơm trưa."
    history = []
    for instruction in (
        "Viết lại tự nhiên hơn, không thêm thông tin mới",
        "Viết chương trình sắp xếp mảng bằng Python",
    ):
        start = monotonic()
        answer = generate_answer(AdvisorRequest(
            target="poi", description=source, message=instruction, history=history,
        ))
        print(f"Yêu cầu: {instruction}\nPhản hồi: {answer}\nThời gian: {monotonic() - start:.1f}s", flush=True)
        if "Python" in instruction:
            assert answer == REFUSAL, "Model did not refuse out-of-scope request"
        history.extend([{"role": "user", "content": instruction}, {"role": "assistant", "content": answer}])
