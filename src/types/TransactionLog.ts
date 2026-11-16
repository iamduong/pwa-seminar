import type { Pagination } from "./contract/Pagination";

export type TransactionLog = {
  id: string;
  transaction_date: string;
  content: string;
  amount: string | number;
  reference_code: string;
  created_at: string;
};

export type TransactionLogPagination = Pagination<TransactionLog> & {
  total_amount: string | number;
};
