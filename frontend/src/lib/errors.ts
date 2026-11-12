import { isAxiosError } from "axios";
import type { ApiErrorBody } from "../types/auth";

/** Turns any thrown value into a message a person can read, preferring the server's own message. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return "Cannot reach the server. Check your connection and try again.";
    const data = error.response.data;
    if (data?.details?.length) return data.details[0];
    if (data?.message) return data.message;
    if (error.response.status === 403) return "You do not have permission to do that.";
    if (error.response.status === 404) return "That item no longer exists.";
  }
  return fallback;
}
