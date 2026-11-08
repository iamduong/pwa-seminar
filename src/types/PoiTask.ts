import type { Pagination } from "./contract/Pagination";

export type PoiTaskType = "create" | "update";
export type PoiTaskStatus = "queued" | "running" | "done" | "failed";
export type PoiTaskViewStatus = "processing" | "done" | "failed";
export type ProcessStatus = "pending" | "done" | "failed";

export type PoiTaskEvent = {
  message: string;
  language: string | null;
  started_at: string;
};

export type PoiTaskProcess = {
  language: string;
  translation_status: ProcessStatus;
  audio_status: ProcessStatus;
  audio_url: string | null;
  error_message: string | null;
};

export type PoiTask = {
  id: string;
  poi_id: string;
  type: PoiTaskType;
  status: PoiTaskStatus;
  progress_percent: number;
  target_languages: string[];
  step_language: string | null;
  activation_requested: boolean;
  retry_count: number;
  max_retries: number;
  events: PoiTaskEvent[];
  processes: PoiTaskProcess[];
  created_at: string;
  updated_at: string;
};

export type PoiTaskPagination = Pagination<PoiTask>;
