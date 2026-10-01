import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "./features/auth/AuthContext";
import { RequireAuth } from "./features/auth/RequireAuth";
import { MainLayout } from "./components/layout/MainLayout";
import { RouteTitle } from "./components/layout/RouteTitle";


// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { UnsubscribePage } from "./pages/UnsubscribePage";
import { PublicRecapPage } from "./pages/PublicRecapPage";
import { RecapPage } from "./pages/RecapPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { CreateApplicationPage } from "./pages/CreateApplicationPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* "user": honour prefers-reduced-motion by dropping transform/layout animation but keeping opacity fades. */}
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <BrowserRouter>
            <RouteTitle />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/r/:slug" element={<PublicRecapPage />} />

              {/* Protected Routes */}
              <Route element={<RequireAuth />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/applications/new" element={<CreateApplicationPage />} />
                  <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                  <Route path="/recap" element={<RecapPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </MotionConfig>
      <Analytics />
    </QueryClientProvider>
  );
}

export default App;
