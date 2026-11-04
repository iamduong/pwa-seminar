import { useState } from "react";
import {
  ActivityIcon,
  BotIcon,
  CircleDotIcon,
  Clock3Icon,
  ListTreeIcon,
  MapPinIcon,
} from "lucide-react";

import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockTitle,
} from "#components/ui/code-block";
import { cn } from "#lib/utils";

type DemoPoiTask = {
  id: string;
  poiId: string;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  startedAt: string;
  logs: string[];
};

const STATUS_META: Record<
  DemoPoiTask["status"],
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

const DEMO_TASKS: DemoPoiTask[] = [
  {
    id: "690ad45aee12c987f45a1001",
    poiId: "690ad3f4ee12c987f45a0ff1",
    status: "done",
    progress: 100,
    startedAt: "04/11/2026, 08:31",
    logs: [
      "[08:31:02] Task đã được đưa vào hàng đợi.",
      "[08:31:03] Worker bắt đầu xử lý POI 690ad3f4ee12c987f45a0ff1.",
      "[08:31:04] Đang chuẩn hóa nội dung thuyết minh.",
      "[08:31:06] Hoàn tất bản dịch tiếng Việt.",
      "[08:31:07] Đang tạo dữ liệu âm thanh.",
      "[08:31:12] Hoàn tất âm thanh tiếng Việt.",
      "[08:31:13] Tiến trình hoàn thành.",
    ],
  },
  {
    id: "690ad45aee12c987f45a1002",
    poiId: "690ad3f4ee12c987f45a0ff2",
    status: "running",
    progress: 68,
    startedAt: "04/11/2026, 08:34",
    logs: [
      "[08:34:18] Task đã được đưa vào hàng đợi.",
      "[08:34:21] Worker bắt đầu xử lý POI 690ad3f4ee12c987f45a0ff2.",
      "[08:34:23] Đang chuẩn hóa nội dung thuyết minh.",
      "[08:34:27] Đang dịch nội dung sang tiếng Anh.",
      "[08:34:31] Hoàn tất bản dịch tiếng Anh.",
      "[08:34:32] Đang tạo dữ liệu âm thanh.",
    ],
  },
  {
    id: "690ad45aee12c987f45a1003",
    poiId: "690ad3f4ee12c987f45a0ff3",
    status: "queued",
    progress: 0,
    startedAt: "Chưa bắt đầu",
    logs: [
      "[08:40:05] Task đã được đưa vào hàng đợi.",
      "[08:40:06] Đang chờ worker khả dụng.",
    ],
  },
  {
    id: "690ad45aee12c987f45a1004",
    poiId: "690ad3f4ee12c987f45a0ff4",
    status: "failed",
    progress: 32,
    startedAt: "04/11/2026, 08:42",
    logs: [
      "[08:42:10] Task đã được đưa vào hàng đợi.",
      "[08:42:12] Worker bắt đầu xử lý POI 690ad3f4ee12c987f45a0ff4.",
      "[08:42:14] Đang chuẩn hóa nội dung thuyết minh.",
      "[08:42:16] Không thể đọc nội dung đầu vào.",
      "[08:42:16] Tiến trình kết thúc với trạng thái thất bại.",
    ],
  },
];

export default function PoiTaskMonitorPage() {
  const [selectedTaskId, setSelectedTaskId] = useState(DEMO_TASKS[0].id);
  const selectedTask =
    DEMO_TASKS.find((task) => task.id === selectedTaskId) ?? DEMO_TASKS[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Theo dõi tiến trình POI
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn một mã tác vụ để xem nhật ký xử lý tương ứng.
        </p>
      </header>

      <div className="grid min-h-150 gap-4 lg:h-[calc(100dvh-14rem)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <section
          className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
          aria-labelledby="poi-task-list-title"
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ListTreeIcon className="size-4" aria-hidden="true" />
            <h2 id="poi-task-list-title" className="font-semibold">
              Danh sách tác vụ
            </h2>
          </div>

          <div className="max-h-64 min-h-0 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
            {DEMO_TASKS.map((task) => {
              const selected = task.id === selectedTask.id;

              return (
                <button
                  key={task.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={cn(
                    "w-full rounded-lg border border-transparent px-3 py-3 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected && "border-border bg-muted text-foreground",
                  )}
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
                      {task.progress}%
                    </span>
                  </span>
                  <TaskProgress task={task} className="mt-2" />
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-neutral-950 shadow-sm"
          aria-labelledby="task-monitor-title"
        >
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
            </CodeBlockHeader>

            <div className="border-b border-neutral-800 bg-neutral-900/70 px-4 py-4">
              <div className="grid gap-3 text-xs text-neutral-400 sm:grid-cols-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPinIcon className="size-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p>POI</p>
                    <p className="truncate font-mono text-neutral-100">
                      {selectedTask.poiId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3Icon className="size-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p>Bắt đầu</p>
                    <p className="text-neutral-100">{selectedTask.startedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BotIcon className="size-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p>Worker</p>
                    <p className="text-neutral-100">
                      {selectedTask.status === "queued" ? "Chưa gán" : "audio-worker-01"}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <CodeBlockContent
              className="flex-1 px-4 py-4 text-xs leading-6 text-neutral-200 sm:text-sm"
              aria-label={`Nhật ký tác vụ ${selectedTask.id}`}
            >
              {selectedTask.logs.join("\n")}
            </CodeBlockContent>
            <CodeBlockFooter className="block border-t border-neutral-800 bg-neutral-900 px-4 py-3 pb-3 text-neutral-200">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium">Tiến độ xử lý</span>
                <span className="font-mono text-base font-semibold text-neutral-100">
                  {selectedTask.progress}%
                </span>
              </div>
              <TaskProgress task={selectedTask} dark className="h-2.5" />
            </CodeBlockFooter>
          </CodeBlock>
        </section>
      </div>
    </div>
  );
}

function TaskProgress({
  task,
  dark = false,
  className,
}: {
  task: DemoPoiTask;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={`Tiến độ tác vụ ${task.id}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={task.progress}
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
        style={{ width: `${task.progress}%` }}
      />
    </div>
  );
}
