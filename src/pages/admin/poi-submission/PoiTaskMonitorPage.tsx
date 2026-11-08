import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIcon,
  AlertCircleIcon,
  BotIcon,
  ChevronDownIcon,
  CircleDotIcon,
  Clock3Icon,
  LanguagesIcon,
  ListTreeIcon,
  LoaderCircleIcon,
  MapPinIcon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";

import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockTitle,
} from "#components/ui/code-block";
import { cn } from "#lib/utils";
import { poiTaskService } from "../../../services/PoiTaskService";
import type {
  PoiTask,
  PoiTaskProcess,
  PoiTaskStatus,
  PoiTaskViewStatus,
  ProcessStatus,
} from "../../../types/PoiTask";

type TaskFilter = PoiTaskViewStatus | "all";

const STATUS_META: Record<
  PoiTaskStatus,
  { label: string; badgeClassName: string; progressClassName: string }
> = {
  queued: {
    label: "Đang chờ",
    badgeClassName:
      "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
    progressClassName: "bg-amber-500",
  },
  running: {
    label: "Đang xử lý",
    badgeClassName:
      "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300",
    progressClassName: "bg-blue-500",
  },
  done: {
    label: "Hoàn tất",
    badgeClassName:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300",
    progressClassName: "bg-emerald-500",
  },
  failed: {
    label: "Thất bại",
    badgeClassName:
      "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
    progressClassName: "bg-red-500",
  },
};

const PROCESS_STATUS_META: Record<
  ProcessStatus,
  { label: string; className: string }
> = {
  pending: { label: "Chờ", className: "text-amber-700 dark:text-amber-300" },
  done: { label: "Xong", className: "text-emerald-700 dark:text-emerald-300" },
  failed: { label: "Lỗi", className: "text-red-700 dark:text-red-300" },
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "medium",
});

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeStyle: "medium",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function formatEventTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--:--" : timeFormatter.format(date);
}

function matchesFilter(task: PoiTask, filter: TaskFilter) {
  if (filter === "all") return true;
  if (filter === "processing") {
    return task.status === "queued" || task.status === "running";
  }
  return task.status === filter;
}

function sortTasks(tasks: PoiTask[]) {
  return [...tasks].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function mergeTasks(
  snapshot: PoiTask[],
  current: PoiTask[],
  filter: TaskFilter,
) {
  const merged = new Map(snapshot.map((task) => [task.id, task]));

  for (const task of current) {
    const snapshotTask = merged.get(task.id);
    if (
      !snapshotTask ||
      new Date(task.updated_at).getTime() >
        new Date(snapshotTask.updated_at).getTime()
    ) {
      merged.set(task.id, task);
    }
  }

  return sortTasks(
    [...merged.values()].filter((task) => matchesFilter(task, filter)),
  );
}

function formatTaskEvents(task: PoiTask) {
  if (task.events.length === 0) return "Chưa có nhật ký xử lý.";

  return task.events
    .map((event) => {
      const language = event.language ? ` [${event.language}]` : "";
      return `[${formatEventTime(event.started_at)}]${language} ${event.message}`;
    })
    .join("\n");
}

export default function PoiTaskMonitorPage() {
  const [tasks, setTasks] = useState<PoiTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [retryingTaskId, setRetryingTaskId] = useState<string | null>(null);

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;

  const loadTasks = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);

      try {
        const response = await poiTaskService.GetPoiTasks(
          {
            page: 1,
            pageSize: 100,
            viewStatus: filter === "all" ? undefined : filter,
          },
          signal,
        );

        if (!response.success || !response.data) {
          throw new Error(response.message || "Dữ liệu tiến trình không hợp lệ.");
        }

        setTasks((current) => mergeTasks(response.data!.data, current, filter));
        setErrorMessage(null);
      } catch (error) {
        if (signal?.aborted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách tiến trình.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadTasks(controller.signal);
    return () => controller.abort();
  }, [loadTasks]);

  useEffect(() => {
    const source = new EventSource(poiTaskService.GetPoiTaskStreamUrl(), {
      withCredentials: true,
    });

    const handleConnected = () => setStreamConnected(true);
    const handleTaskUpdated = (event: Event) => {
      try {
        const task = JSON.parse((event as MessageEvent<string>).data) as PoiTask;

        setTasks((current) => {
          const withoutTask = current.filter((item) => item.id !== task.id);
          if (!matchesFilter(task, filter)) return withoutTask;
          return sortTasks([task, ...withoutTask]);
        });
      } catch {
        setErrorMessage("Không thể đọc dữ liệu cập nhật từ máy chủ.");
      }
    };

    source.addEventListener("connected", handleConnected);
    source.addEventListener("task.updated", handleTaskUpdated);
    source.onopen = handleConnected;
    source.onerror = () => setStreamConnected(false);

    return () => {
      source.removeEventListener("connected", handleConnected);
      source.removeEventListener("task.updated", handleTaskUpdated);
      source.close();
    };
  }, [filter]);

  useEffect(() => {
    if (tasks.length === 0) {
      if (selectedTaskId !== null) setSelectedTaskId(null);
      return;
    }

    if (!tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [selectedTaskId, tasks]);

  const toggleProcesses = (taskId: string) => {
    setExpandedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const retryTask = async (taskId: string) => {
    setRetryingTaskId(taskId);
    try {
      const response = await poiTaskService.RetryPoiTask(taskId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Không thể retry tiến trình.");
      }
      setTasks((current) =>
        sortTasks([
          response.data!,
          ...current.filter((task) => task.id !== taskId),
        ]).filter((task) => matchesFilter(task, filter)),
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể retry tiến trình.",
      );
    } finally {
      setRetryingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Theo dõi tiến trình POI
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi trạng thái dịch nội dung và tạo âm thanh theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              streamConnected ? "bg-emerald-500" : "bg-red-500",
            )}
            aria-hidden="true"
          />
          {streamConnected ? "Đang nhận cập nhật" : "Đang kết nối lại"}
        </div>
      </header>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="grid min-h-150 min-w-[64rem] grid-cols-[22rem_minmax(0,1fr)] gap-4 lg:h-[calc(100dvh-14rem)]">
          <section
          className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
          aria-labelledby="poi-task-list-title"
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ListTreeIcon className="size-4" aria-hidden="true" />
            <h2 id="poi-task-list-title" className="font-semibold">
              Danh sách tác vụ
            </h2>
            <button
              type="button"
              className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              disabled={loading}
              onClick={() => void loadTasks()}
              aria-label="Làm mới danh sách tác vụ"
            >
              <RefreshCwIcon
                className={cn("size-4", loading && "animate-spin")}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="border-b p-3">
            <label className="text-xs font-medium text-muted-foreground">
              Trạng thái
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as TaskFilter)}
                className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:ring-3 focus:ring-ring/30"
              >
                <option value="all">Tất cả</option>
                <option value="processing">Đang xử lý</option>
                <option value="done">Hoàn tất</option>
                <option value="failed">Thất bại</option>
              </select>
            </label>
          </div>

          <div className="max-h-96 min-h-0 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
            {loading && tasks.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
                Đang tải tiến trình…
              </div>
            ) : tasks.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                Không có tác vụ phù hợp.
              </p>
            ) : (
              tasks.map((task) => {
                const selected = task.id === selectedTask?.id;
                const expanded = expandedTaskIds.has(task.id);

                return (
                  <article
                    key={task.id}
                    className={cn(
                      "mb-2 overflow-hidden rounded-lg border transition-colors",
                      selected ? "border-primary/40 bg-muted" : "border-transparent",
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full px-3 py-3 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CircleDotIcon
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground",
                            selected && "text-primary",
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate font-mono text-xs font-medium">
                          {task.id}
                        </span>
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[0.68rem] font-medium",
                            STATUS_META[task.status].badgeClassName,
                          )}
                        >
                          {STATUS_META[task.status].label}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {task.progress_percent}%
                        </span>
                      </span>
                      <TaskProgress task={task} className="mt-2" />
                    </button>

                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => toggleProcesses(task.id)}
                      className="flex w-full items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <span>{task.processes.length} ngôn ngữ</span>
                      <ChevronDownIcon
                        className={cn(
                          "size-4 transition-transform",
                          expanded && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {expanded && (
                      <div className="space-y-2 border-t bg-background/70 p-2">
                        {task.processes.length === 0 ? (
                          <p className="px-1 py-2 text-xs text-muted-foreground">
                            Chưa có tiến trình ngôn ngữ.
                          </p>
                        ) : (
                          task.processes.map((process) => (
                            <ProcessSummary
                              key={process.language}
                              process={process}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
          </section>

          <section
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-neutral-950 shadow-sm"
          aria-labelledby="task-monitor-title"
        >
          {selectedTask ? (
            <CodeBlock className="h-full rounded-none border-0 bg-neutral-950 text-neutral-100">
              <CodeBlockHeader className="border-b border-neutral-800 px-4 py-3 pt-3 text-neutral-400">
                <CodeBlockTitle
                  id="task-monitor-title"
                  className="flex items-center text-neutral-100"
                >
                  <ActivityIcon className="text-emerald-400" aria-hidden="true" />
                  {selectedTask.id}
                </CodeBlockTitle>
                <span
                  className={cn(
                    "ml-auto rounded-md px-2 py-1 text-xs font-medium",
                    STATUS_META[selectedTask.status].badgeClassName,
                  )}
                >
                  {STATUS_META[selectedTask.status].label}
                </span>
                {selectedTask.status === "failed" && (
                  <button
                    type="button"
                    onClick={() => void retryTask(selectedTask.id)}
                    disabled={retryingTaskId === selectedTask.id}
                    className="ml-2 flex items-center gap-1.5 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcwIcon
                      className={cn(
                        "size-3.5",
                        retryingTaskId === selectedTask.id && "animate-spin",
                      )}
                      aria-hidden="true"
                    />
                    Retry
                  </button>
                )}
              </CodeBlockHeader>

              <div className="border-b border-neutral-800 bg-neutral-900/70 px-4 py-4">
                <div className="grid gap-3 text-xs text-neutral-400 sm:grid-cols-2 xl:grid-cols-4">
                  <MonitorMeta
                    icon={<MapPinIcon className="size-4" aria-hidden="true" />}
                    label="POI"
                    value={selectedTask.poi_id}
                    mono
                  />
                  <MonitorMeta
                    icon={<Clock3Icon className="size-4" aria-hidden="true" />}
                    label="Khởi tạo"
                    value={formatDateTime(selectedTask.created_at)}
                  />
                  <MonitorMeta
                    icon={<LanguagesIcon className="size-4" aria-hidden="true" />}
                    label="Ngôn ngữ hiện tại"
                    value={selectedTask.step_language ?? "Chưa xử lý"}
                  />
                  <MonitorMeta
                    icon={<BotIcon className="size-4" aria-hidden="true" />}
                    label="Worker"
                    value={
                      selectedTask.status === "queued" ? "Đang chờ" : "Worker nền"
                    }
                  />
                  <MonitorMeta
                    icon={<RotateCcwIcon className="size-4" aria-hidden="true" />}
                    label="Tự động retry"
                    value={`${selectedTask.retry_count}/${selectedTask.max_retries}`}
                  />
                </div>
              </div>

              <CodeBlockContent
                className="flex-1 px-4 py-4 text-xs leading-6 text-neutral-200 sm:text-sm"
                aria-label={`Nhật ký tác vụ ${selectedTask.id}`}
              >
                {formatTaskEvents(selectedTask)}
              </CodeBlockContent>
              <CodeBlockFooter className="block border-t border-neutral-800 bg-neutral-900 px-4 py-3 pb-3 text-neutral-200">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">Tiến độ xử lý</span>
                  <span className="font-mono text-base font-semibold text-neutral-100">
                    {selectedTask.progress_percent}%
                  </span>
                </div>
                <TaskProgress task={selectedTask} dark className="h-2.5" />
              </CodeBlockFooter>
            </CodeBlock>
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center px-6 text-center text-sm text-neutral-400">
              Chọn một tác vụ để xem nhật ký xử lý.
            </div>
          )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProcessSummary({ process }: { process: PoiTaskProcess }) {
  return (
    <div className="rounded-md border bg-card px-2.5 py-2 text-xs">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-semibold uppercase">{process.language}</span>
        {process.error_message && (
          <span
            className="max-w-40 truncate text-red-600"
            title={process.error_message}
          >
            {process.error_message}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
        <span>
          Dịch:{" "}
          <strong
            className={PROCESS_STATUS_META[process.translation_status].className}
          >
            {PROCESS_STATUS_META[process.translation_status].label}
          </strong>
        </span>
        <span>
          Audio:{" "}
          <strong className={PROCESS_STATUS_META[process.audio_status].className}>
            {PROCESS_STATUS_META[process.audio_status].label}
          </strong>
        </span>
      </div>
    </div>
  );
}

function MonitorMeta({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p>{label}</p>
        <p className={cn("truncate text-neutral-100", mono && "font-mono")}>
          {value}
        </p>
      </div>
    </div>
  );
}

function TaskProgress({
  task,
  dark = false,
  className,
}: {
  task: PoiTask;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={`Tiến độ tác vụ ${task.id}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={task.progress_percent}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        dark && "bg-neutral-800",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          STATUS_META[task.status].progressClassName,
        )}
        style={{ width: `${task.progress_percent}%` }}
      />
    </div>
  );
}
