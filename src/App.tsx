import { BrowserRouter, Navigate, Route, Routes } from "react-router";

// Protect router component
import { ProtectedRoute } from "#components/auth/ProtectedRoute";
// Layout
import { AdminLayout } from "#components/layout/AdminLayout";
import { ClientLayout } from "#components/layout/ClientLayout";
// Authorize page
import { LoginPage } from "./pages/authorize/LoginPage";
import { RegisterPage } from "./pages/authorize/RegisterPage";
// Client page
import HomePage from "./pages/HomePage";
import { ProfilePage } from "./pages/client/ProfilePage";
import { RegisterOwnerPage } from "./pages/client/RegisterOwnerPage";
// Admin page
import PoiOwnerRegistrationsPage from "./pages/admin/poi-owner-registration/PoiOwnerRegistrationsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routers */}
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/mon-an" element={<HomePage />} />
            <Route path="/gan-toi" element={<HomePage />} />
            <Route path="/quet-qr" element={<HomePage />} />
            <Route path="/ho-so" element={<ProfilePage />} />
            <Route path="/chu-quan" element={<RegisterOwnerPage />} />
          </Route>

          <Route path="/quan-ly" element={<AdminLayout />}>
            <Route path="don-chu-qua" element={<PoiOwnerRegistrationsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
