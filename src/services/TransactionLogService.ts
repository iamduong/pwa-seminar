import api, { type ApiResponse } from "#lib/api";
import type { TransactionLogPagination } from "../types/TransactionLog";

class TransactionLogService {
  async list(
    query: {
      q?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      pageSize?: number;
    } = {},
    signal?: AbortSignal,
  ) {
    const { q = "", dateFrom, dateTo, page = 1, pageSize = 20 } = query;
    const response = await api.get<ApiResponse<TransactionLogPagination>>(
      "/transaction-logs",
      {
        params: {
          q: q.trim() || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page,
          page_size: pageSize,
        },
        signal,
      },
    );
    return response.data;
  }
}

export const transactionLogService = new TransactionLogService();
