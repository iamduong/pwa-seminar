import type { AdvisorMessage } from "../types/AiAdvisor";

const PREFIX = "pwa:ai-advisor:v1:";
export interface AdvisorConversation {
  target: "poi" | "menu";
  description: string;
  messages: AdvisorMessage[];
  historyStart?: number;
}
const empty = (): AdvisorConversation => ({ target: "poi", description: "", messages: [] });
export function readConversation(userId: string): AdvisorConversation {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(PREFIX + userId) ?? "null");
    if (!raw || typeof raw !== "object") return empty();
    const value = raw as Partial<AdvisorConversation>;
    if ((value.target !== "poi" && value.target !== "menu") || typeof value.description !== "string" || !Array.isArray(value.messages)) return empty();
    const messages = value.messages.filter((item): item is AdvisorMessage =>
      Boolean(item) && (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && item.content.length <= 6000,
    ).slice(-40);
    return { target: value.target, description: value.description.slice(0, 4000), messages, historyStart: typeof value.historyStart === "number" && Number.isInteger(value.historyStart) && value.historyStart >= 0 && value.historyStart <= messages.length ? value.historyStart : messages.length };
  } catch { return empty(); }
}
export function saveConversation(userId: string, value: AdvisorConversation): boolean {
  try { sessionStorage.setItem(PREFIX + userId, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function clearAdvisorSessions() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(PREFIX)) sessionStorage.removeItem(key);
    }
  } catch { /* Storage may be disabled by the browser. */ }
}
