import { ChevronRightIcon, LocateFixedIcon, RefreshCwIcon } from "lucide-react"
import { Outlet } from "react-router"

import { Button } from "#components/ui/button"
import { useLanguage } from "#hooks/use-language"
import { useLocation } from "#hooks/use-location"
import { useIsMobile } from "#hooks/use-mobile"
import { LocationProvider } from "../../../../providers/LocationProvider"
import { supportedLanguages } from "../../../../providers/contexts/language-context"

const locationCopy = {
  "vi-VN": {
    title: "Cho phép truy cập vị trí",
    description:
      "Ứng dụng cần quyền truy cập GPS để hiển thị các địa điểm và nội dung phù hợp quanh bạn.",
    denied:
      "Quyền vị trí đang bị tắt. Hãy bật quyền vị trí trong cài đặt trình duyệt rồi kiểm tra lại.",
    error: "Chưa thể xác định vị trí. Hãy bật GPS và thử kiểm tra lại.",
    unsupported: "Thiết bị hoặc trình duyệt này không hỗ trợ định vị.",
    check: "Kiểm tra quyền GPS",
    checking: "Đang kiểm tra…",
  },
  "en-US": {
    title: "Allow location access",
    description:
      "The app needs GPS access to show relevant places and content around you.",
    denied:
      "Location access is disabled. Enable it in your browser settings, then check again.",
    error: "Your location could not be determined. Enable GPS and try again.",
    unsupported: "Location is not supported by this device or browser.",
    check: "Check GPS access",
    checking: "Checking…",
  },
  "zh-CN": {
    title: "允许访问位置",
    description: "应用需要访问 GPS，以显示您附近的地点和相关内容。",
    denied: "位置权限已关闭。请在浏览器设置中开启位置权限，然后重新检查。",
    error: "暂时无法确定您的位置。请开启 GPS 后重试。",
    unsupported: "此设备或浏览器不支持定位功能。",
    check: "检查 GPS 权限",
    checking: "正在检查…",
  },
  "ja-JP": {
    title: "位置情報へのアクセスを許可",
    description: "周辺の場所や関連情報を表示するために、GPSへのアクセスが必要です。",
    denied: "位置情報の権限が無効です。ブラウザの設定で有効にしてから再確認してください。",
    error: "現在地を取得できません。GPSを有効にして再試行してください。",
    unsupported: "この端末またはブラウザは位置情報に対応していません。",
    check: "GPS権限を確認",
    checking: "確認中…",
  },
  "ko-KR": {
    title: "위치 접근 허용",
    description: "주변 장소와 관련 콘텐츠를 표시하려면 GPS 접근 권한이 필요합니다.",
    denied: "위치 권한이 꺼져 있습니다. 브라우저 설정에서 권한을 켠 후 다시 확인해 주세요.",
    error: "현재 위치를 확인할 수 없습니다. GPS를 켠 후 다시 시도해 주세요.",
    unsupported: "이 기기 또는 브라우저는 위치 기능을 지원하지 않습니다.",
    check: "GPS 권한 확인",
    checking: "확인 중…",
  },
} as const

function FullScreenCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/50 p-5">
      <section className="w-full max-w-sm rounded-3xl border bg-background p-6 shadow-xl">
        {children}
      </section>
    </main>
  )
}

function LanguageSelection() {
  const { setLanguage } = useLanguage()

  return (
    <main className="fixed inset-0 z-100 flex h-dvh flex-col overflow-hidden bg-background px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="shrink-0 text-left">
        <p className="text-sm font-medium text-muted-foreground">Quan4 Tourism</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Chọn ngôn ngữ</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Chọn ngôn ngữ bạn muốn sử dụng trong ứng dụng.
        </p>
      </header>

      <div
        className="mt-24 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1 pb-2"
        role="radiogroup"
        aria-label="Ngôn ngữ"
      >
        {supportedLanguages.map((item) => (
          <button
            key={item.code}
            className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted active:bg-muted"
            type="button"
            onClick={() => setLanguage(item.code)}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold uppercase">
              {item.code.split("-")[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.nativeLabel}</span>
              <span className="block text-xs text-muted-foreground">{item.label}</span>
            </span>
            <ChevronRightIcon
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </main>
  )
}

function LocationPermission() {
  const { language } = useLanguage()
  const { status, errorMessage, checkLocationPermission } = useLocation()
  const copy = locationCopy[language]

  if (status === "ready") return <Outlet />

  const statusMessage =
    status === "denied"
      ? copy.denied
      : status === "unsupported"
        ? copy.unsupported
        : status === "error"
          ? copy.error
          : copy.description

  return (
    <FullScreenCard>
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <LocateFixedIcon className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold">{copy.title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusMessage}</p>
      {errorMessage && status === "error" && (
        <p className="mt-2 text-xs text-destructive">{errorMessage}</p>
      )}

      <Button
        className="mt-6 h-11 w-full rounded-xl"
        type="button"
        onClick={checkLocationPermission}
        disabled={status === "checking" || status === "unsupported"}
      >
        <RefreshCwIcon
          className={status === "checking" ? "animate-spin" : ""}
          aria-hidden="true"
        />
        {status === "checking" ? copy.checking : copy.check}
      </Button>
    </FullScreenCard>
  )
}

function ClientLocationGate({ isMobile }: { isMobile: boolean }) {
  return isMobile ? <LocationPermission /> : <Outlet />
}

export function MobileClientAccessGate() {
  const isMobile = useIsMobile()
  const { hasSelectedLanguage } = useLanguage()

  if (isMobile && !hasSelectedLanguage) return <LanguageSelection />

  return (
    <LocationProvider>
      <ClientLocationGate isMobile={isMobile} />
    </LocationProvider>
  )
}
