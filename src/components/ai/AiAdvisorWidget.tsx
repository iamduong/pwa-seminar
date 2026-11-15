import { useEffect, useRef, useState, type FormEvent } from "react";
import { BotIcon, Loader2Icon, MessageCircleIcon, SendIcon, XIcon } from "lucide-react";
import { Button } from "#components/ui/button";
import { Textarea } from "#components/ui/textarea";
import { Label } from "#components/ui/label";
import { getApiErrorMessage } from "#lib/api";
import { readConversation, saveConversation } from "#lib/ai-advisor-session";
import { aiAdvisorService } from "../../services/AiAdvisorService";
import type { AdvisorUsage } from "../../types/AiAdvisor";

export function AiAdvisorWidget({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(() => readConversation(userId));
  const [message, setMessage] = useState("");
  const [usage, setUsage] = useState<AdvisorUsage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    const saved = saveConversation(userId, conversation);
    // Report browser storage restrictions without preventing the conversation.
    const timer = window.setTimeout(() => setStorageError(!saved), 0);
    return () => window.clearTimeout(timer);
  }, [conversation, userId]);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function refresh() {
      try { setUsage(await aiAdvisorService.usage(controller.signal)); }
      catch (failure) { if (!controller.signal.aborted) setError(getApiErrorMessage(failure)); }
    }
    void refresh();
    // Refresh at midnight and pick up usage from other tabs.
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [conversation.messages, busy, open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (requestRef.current || !message.trim() || !conversation.description.trim()) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const prompt = message.trim();
    setBusy(true);
    setError("");
    try {
      const reply = await aiAdvisorService.chat({
        target: conversation.target, description: conversation.description.trim(),
        message: prompt, history: conversation.messages.slice(conversation.historyStart ?? conversation.messages.length).slice(-12),
      }, controller.signal);
      if (controller.signal.aborted) return;
      setConversation((previous) => ({ ...previous, historyStart: Math.max(0, (previous.historyStart ?? previous.messages.length) - Math.max(0, previous.messages.length + 2 - 40)), messages: [
        ...previous.messages, { role: "user" as const, content: prompt },
        { role: "assistant" as const, content: reply.answer },
      ].slice(-40) }));
      setUsage(reply.usage);
      setMessage("");
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(getApiErrorMessage(failure, "Không thể nhận phản hồi AI. Vui lòng thử lại."));
        try { setUsage(await aiAdvisorService.usage(controller.signal)); } catch { /* Keep the original error. */ }
      }
    } finally {
      requestRef.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <>
    {open && <section id="ai-advisor-conversation" role="dialog" aria-modal="false" aria-labelledby="ai-advisor-title"
      className="fixed right-4 bottom-20 z-50 flex h-[min(44rem,calc(100dvh-7rem))] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
      <header className="flex items-center gap-3 border-b p-4">
        <BotIcon className="size-5 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1"><h2 id="ai-advisor-title" className="font-semibold">Trợ lý nội dung AI</h2>
          <p className="text-xs text-muted-foreground">Biên tập mô tả POI và thực đơn bằng tiếng Việt</p></div>
        <Button ref={closeRef} size="icon-sm" variant="ghost" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Đóng trợ lý AI"><XIcon /></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <fieldset disabled={busy} className="space-y-3 border-b pb-4">
          <legend className="mb-2 text-sm font-medium">Ngữ cảnh biên tập</legend>
          <div className="flex gap-2">{(["poi", "menu"] as const).map((target) => <Button key={target} size="sm" variant={conversation.target === target ? "default" : "outline"}
            aria-pressed={conversation.target === target} onClick={() => setConversation((value) => ({ ...value, target, historyStart: target === value.target ? value.historyStart : value.messages.length }))}>{target === "poi" ? "Điểm POI" : "Thực đơn"}</Button>)}</div>
          <p className="text-xs text-muted-foreground">Đổi loại nội dung hoặc mô tả sẽ bắt đầu ngữ cảnh mới; tin nhắn cũ vẫn được giữ để xem.</p>
          <Label htmlFor="ai-description">Mô tả gốc và thông tin đã xác thực</Label>
          <Textarea id="ai-description" maxLength={4000} value={conversation.description} onChange={(event) => setConversation((value) => ({ ...value, description: event.target.value, historyStart: value.messages.length }))}
            placeholder="Dán mô tả POI hoặc món ăn cần cải thiện…" className="min-h-20" />
        </fieldset>
        <div role="log" aria-label="Hội thoại với trợ lý AI" aria-live="polite" className="space-y-3 pt-4">
          {conversation.messages.length === 0 && <p className="text-sm leading-6 text-muted-foreground">Cung cấp mô tả gốc rồi yêu cầu viết lại, rút gọn hoặc góp ý. Hội thoại được giữ trong phiên của tab này (tối đa 40 tin nhắn).</p>}
          {conversation.messages.map((item, index) => <div key={index} className={`rounded-lg border p-3 text-sm ${item.role === "user" ? "ml-6 bg-muted" : "mr-6 bg-background"}`}>
            <p className="mb-1 text-xs font-medium text-muted-foreground">{item.role === "user" ? "Bạn" : "Trợ lý AI"}</p>
            <p className="whitespace-pre-wrap break-words leading-6">{item.content}</p>
          </div>)}
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2Icon className="size-4 animate-spin" />Đang biên tập mô tả…</p>}
          <div ref={endRef} />
        </div>
      </div>
      <form onSubmit={(event) => void submit(event)} className="space-y-2 border-t p-3">
        <p className="text-xs text-muted-foreground">{usage ? `Còn ${usage.remaining}/${usage.daily_limit} câu hỏi ngày ${usage.usage_date}. Đặt lại lúc 00:00 (Việt Nam).` : "Đang kiểm tra hạn mức…"}</p>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {storageError && <p role="status" className="text-xs text-destructive">Trình duyệt không cho lưu phiên; hội thoại có thể mất khi tải lại.</p>}
        <div className="flex items-end gap-2">
          <Textarea aria-label="Yêu cầu biên tập" maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} disabled={busy}
            placeholder="Ví dụ: Viết lại mô tả ngắn gọn và tự nhiên hơn" className="min-h-18 resize-none" />
          <Button type="submit" size="icon" disabled={busy || !usage || usage.remaining === 0 || !message.trim() || !conversation.description.trim()} aria-label="Gửi yêu cầu"><SendIcon /></Button>
        </div>
        <p className="text-xs text-muted-foreground">AI chỉ đề xuất; hãy kiểm tra nội dung trước khi lưu.</p>
      </form>
    </section>}
    <Button ref={triggerRef} size="icon-lg" className="fixed right-4 bottom-4 z-50 size-13 rounded-full shadow-lg" onClick={() => setOpen((value) => !value)}
      aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"} aria-expanded={open} aria-controls="ai-advisor-conversation">
      {open ? <XIcon /> : <MessageCircleIcon />}
    </Button>
  </>;
}
