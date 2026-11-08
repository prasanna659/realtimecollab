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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
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
            <Route path="*" element={<Navigate to="/workspaces" replace />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
