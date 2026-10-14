import { useAuth } from "#hooks/use-auth"

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Xin chào {user?.fullName}. Các mô-đun quản lý sẽ được bổ sung tại đây.
      </p>
    </div>
  )
}
