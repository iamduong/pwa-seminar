import type { ReactNode } from "react"
import { Building2Icon, HeadphonesIcon, MapPinnedIcon } from "lucide-react"

interface AuthLayoutProps {
  children: ReactNode
  description: string
  title: string
  wide?: boolean
}

const benefits = [
  {
    icon: MapPinnedIcon,
    text: "Đưa địa điểm của bạn lên bản đồ du lịch Quận 4",
  },
  {
    icon: HeadphonesIcon,
    text: "Tiếp cận du khách bằng nội dung thuyết minh đa ngôn ngữ",
  },
  {
    icon: Building2Icon,
    text: "Quản lý thông tin doanh nghiệp trên một nền tảng thống nhất",
  },
]

export function AuthLayout({ children, description, title, wide }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[minmax(320px,0.8fr)_minmax(560px,1.2fr)]">
      <aside className="hidden border-r bg-foreground p-10 text-background lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div>
          <a className="inline-flex items-center gap-3" href="/login">
            <span className="flex size-9 items-center justify-center rounded-lg bg-background text-foreground">
              <MapPinnedIcon className="size-5" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Quan4 Tourism</span>
          </a>

          <div className="mt-24 max-w-md">
            <p className="text-sm font-medium text-background/70">Cổng thông tin đối tác</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight">
              Đồng hành cùng hệ sinh thái du lịch địa phương
            </h2>
            <ul className="mt-10 space-y-6">
              {benefits.map(({ icon: Icon, text }) => (
                <li className="flex gap-3 text-sm leading-6 text-background/75" key={text}>
                  <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-background/50">
          Hệ thống hỗ trợ quản lý điểm đến và cơ sở kinh doanh du lịch.
        </p>
      </aside>

      <section className="flex min-h-screen items-start justify-center px-4 py-8 sm:px-8 lg:items-center lg:px-12 lg:py-12">
        <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
          <a className="mb-10 inline-flex items-center gap-2 lg:hidden" href="/login">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <MapPinnedIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="font-semibold">Quan4 Tourism</span>
          </a>

          <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-8">
            <header className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </header>
            {children}
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            Bằng việc tiếp tục, bạn đồng ý tuân thủ quy định sử dụng và chính sách bảo mật của hệ thống.
          </p>
        </div>
      </section>
    </main>
  )
}
