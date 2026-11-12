import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "../Toast";
import { toast, useToastStore } from "../../store/toastStore";

describe("toasts", () => {
  it("can be raised from outside React and shows the message", () => {
    render(<ToastProvider><p>app</p></ToastProvider>);
    act(() => toast.error("Could not save the task."));
    expect(screen.getByText("Could not save the task.")).toBeInTheDocument();
  });

  it("does not stack identical messages", () => {
    useToastStore.setState({ toasts: [] });
    act(() => {
      toast.error("Same");
      toast.error("Same");
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
