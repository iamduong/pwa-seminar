import { useState } from "react";
import { ActivityIcon, CircleDotIcon, ListTreeIcon } from "lucide-react";

import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "#components/ui/code-block";
import { cn } from "#lib/utils";

type DemoPoiTask = {
  id: string;
  logs: string[];
};

const DEMO_TASKS: DemoPoiTask[] = [
  {
    id: "690ad45aee12c987f45a1001",
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
    logs: [
      "[08:40:05] Task đã được đưa vào hàng đợi.",
      "[08:40:06] Đang chờ worker khả dụng.",
    ],
  },
  {
    id: "690ad45aee12c987f45a1004",
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

      <div className="grid min-h-150 overflow-hidden rounded-xl border bg-card shadow-sm lg:h-[calc(100dvh-14rem)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <section
          className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0"
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
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected && "bg-muted font-medium text-foreground",
                  )}
                >
                  <CircleDotIcon
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground",
                      selected && "text-primary",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate font-mono text-xs">{task.id}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col bg-neutral-950"
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
            </CodeBlockHeader>
            <CodeBlockContent
              className="flex-1 px-4 py-4 text-xs leading-6 text-neutral-200 sm:text-sm"
              aria-label={`Nhật ký tác vụ ${selectedTask.id}`}
            >
              {selectedTask.logs.join("\n")}
            </CodeBlockContent>
          </CodeBlock>
        </section>
      </div>
    </div>
  );
}
