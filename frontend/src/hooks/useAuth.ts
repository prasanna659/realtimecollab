import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { authService } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import type { LoginPayload, RegisterPayload } from "../types/auth";

export function useAuth() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { setSession, clearSession, refreshToken, user, isAuthenticated } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, data.refreshToken, data.user);
      push("Signed in successfully", "success");
      navigate("/workspaces");
    },
    onError: () => {
      push("Unable to sign in. Please check your credentials.", "error");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, data.refreshToken, data.user);
      push("Account created successfully", "success");
      navigate("/workspaces");
    },
    onError: () => {
      push("Could not create your account. Please try again.", "error");
    },
  });

  const logout = async () => {
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // token may already be expired/revoked — proceed with local logout regardless
      }
    }
    clearSession();
    navigate("/login");
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout,
  };
}
