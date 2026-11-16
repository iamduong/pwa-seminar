import api, { type ApiResponse } from "#lib/api";
import type { AdvisorDraft, AdvisorUsage } from "../types/AiAdvisor";

export const aiAdvisorService = {
  async usage(signal?: AbortSignal) {
    const { data } = await api.get<ApiResponse<AdvisorUsage>>("/ai-advisor/usage", { signal });
    if (!data.success || !data.data) throw new Error("Invalid response");
    return data.data;
  },
  async chat(body: AdvisorDraft, signal?: AbortSignal) {
    const { data } = await api.post<ApiResponse<{ answer: string; usage: AdvisorUsage }>>(
      "/ai-advisor/chat", body, { signal, timeout: 330_000 },
    );
    if (!data.success || !data.data) throw new Error("Invalid response");
    return data.data;
  },
};
