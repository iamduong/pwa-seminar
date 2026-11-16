export interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}
export interface AdvisorUsage {
  usage_date: string;
  usage_count: number;
  daily_limit: number;
  remaining: number;
}
export interface AdvisorDraft {
  target: "poi" | "menu";
  description: string;
  message: string;
  history: AdvisorMessage[];
}
