import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
import { AppLayout } from "./layouts/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import BoardPage from "./pages/BoardPage";
import MembersPage from "./pages/MembersPage";
import NotFoundPage from "./pages/NotFoundPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Do not retry client errors (401/403/404): they will not fix themselves.
      retry: (count, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        return count < 1 && !(status && status >= 400 && status < 500);
      },
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/workspaces" element={<WorkspacesPage />} />
                <Route path="/workspaces/:workspaceId/board" element={<BoardPage />} />
                <Route path="/workspaces/:workspaceId/members" element={<MembersPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/workspaces" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
