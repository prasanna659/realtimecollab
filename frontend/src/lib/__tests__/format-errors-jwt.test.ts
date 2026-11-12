import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage } from "../errors";
import { formatDueDate, initials, isOverdue, timeAgo } from "../format";
import { isExpiringSoon } from "../jwt";

function axiosError(status: number | null, data?: unknown) {
  const err = new AxiosError("fail");
  if (status !== null) err.response = { status, data } as AxiosResponse;
  return err;
}

describe("getErrorMessage", () => {
  it("prefers the first validation detail, then the server message", () => {
    expect(getErrorMessage(axiosError(400, { message: "Validation failed", details: ["email: must be valid"] })))
      .toBe("email: must be valid");
    expect(getErrorMessage(axiosError(409, { message: "Email already registered", details: [] })))
      .toBe("Email already registered");
  });
  it("explains network failures and common statuses", () => {
    expect(getErrorMessage(axiosError(null))).toMatch(/cannot reach the server/i);
    expect(getErrorMessage(axiosError(403, {}))).toMatch(/permission/i);
    expect(getErrorMessage(axiosError(404, {}))).toMatch(/no longer exists/i);
  });
  it("falls back for unknown errors", () => {
    expect(getErrorMessage(new Error("x"), "fallback")).toBe("fallback");
  });
});

describe("format helpers", () => {
  it("builds initials", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("  madonna ")).toBe("M");
    expect(initials("a b c d")).toBe("AB");
  });
  it("describes elapsed time", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    expect(timeAgo("2026-01-10T11:59:50Z", now)).toBe("just now");
    expect(timeAgo("2026-01-10T11:30:00Z", now)).toBe("30m ago");
    expect(timeAgo("2026-01-10T07:00:00Z", now)).toBe("5h ago");
    expect(timeAgo("2026-01-08T12:00:00Z", now)).toBe("2d ago");
  });
  it("marks a task overdue only after its due day, and never when done", () => {
    const now = new Date(2026, 0, 10, 15, 0);
    expect(isOverdue("2026-01-09", false, now)).toBe(true);
    expect(isOverdue("2026-01-10", false, now)).toBe(false); // due today is not overdue
    expect(isOverdue("2026-01-09", true, now)).toBe(false);
    expect(isOverdue(null, false, now)).toBe(false);
  });
  it("formats a due date without timezone drift", () => {
    expect(formatDueDate("2026-03-05", true)).toMatch(/5/);
  });
});

describe("isExpiringSoon", () => {
  const token = (exp: number) => `x.${btoa(JSON.stringify({ exp })).replace(/=+$/, "")}.y`;
  it("detects tokens that are expired or about to expire", () => {
    const now = 1_000_000_000_000;
    expect(isExpiringSoon(token(now / 1000 + 600), 30, now)).toBe(false);
    expect(isExpiringSoon(token(now / 1000 + 10), 30, now)).toBe(true);
    expect(isExpiringSoon(token(now / 1000 - 5), 30, now)).toBe(true);
  });
  it("treats missing or malformed tokens as expired", () => {
    expect(isExpiringSoon(null)).toBe(true);
    expect(isExpiringSoon("garbage")).toBe(true);
  });
});
