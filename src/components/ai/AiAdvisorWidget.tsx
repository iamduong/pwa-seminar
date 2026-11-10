import { useEffect, useRef, useState } from "react";
import { BotIcon, MessageCircleIcon, SendIcon, XIcon } from "lucide-react";

import { Button } from "#components/ui/button";
import { Textarea } from "#components/ui/textarea";

export function AiAdvisorWidget() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      {open && (
        <section
          id="ai-advisor-conversation"
          className="fixed right-4 bottom-20 z-50 flex h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-xl"
          role="dialog"
          aria-modal="false"
          aria-labelledby="ai-advisor-title"
        >
          <header className="flex items-center gap-3 border-b p-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BotIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="ai-advisor-title" className="font-semibold">Trợ lý nội dung AI</h2>
              <p className="text-xs text-muted-foreground">Hỗ trợ nội dung POI và món ăn</p>
            </div>
            <Button ref={closeButtonRef} type="button" size="icon-sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Đóng trợ lý AI">
              <XIcon aria-hidden="true" />
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-4">
            <div className="flex items-start gap-2">
              <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BotIcon className="size-4" aria-hidden="true" />
              </span>
              <div className="max-w-[85%] rounded-xl rounded-tl-sm border bg-background p-3 text-sm leading-6">
                Xin chào! Khu vực hội thoại đã sẵn sàng. Sau khi backend AI được cấu hình, bạn có thể yêu cầu tôi cải thiện mô tả POI, món ăn hoặc góp ý nội dung tại đây.
              </div>
            </div>
          </div>

          <footer className="border-t p-3">
            <div className="flex items-end gap-2">
              <Textarea
                className="min-h-18 resize-none"
                placeholder="Backend AI chưa được cấu hình"
                aria-label="Nội dung trao đổi với trợ lý AI"
                disabled
              />
              <Button type="button" size="icon" disabled aria-label="Gửi tin nhắn">
                <SendIcon aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              AI chỉ đề xuất nội dung; người dùng vẫn phải kiểm tra trước khi lưu.
            </p>
          </footer>
        </section>
      )}

      <Button
        type="button"
        size="icon-lg"
        className="fixed right-4 bottom-4 z-50 size-13 rounded-full shadow-lg"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        aria-expanded={open}
        aria-controls="ai-advisor-conversation"
      >
        {open ? <XIcon aria-hidden="true" /> : <MessageCircleIcon aria-hidden="true" />}
      </Button>
    </>
  );
}
