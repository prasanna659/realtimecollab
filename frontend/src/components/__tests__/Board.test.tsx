import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Board } from "../kanban/Board";
import type { Task, TaskStatus } from "../../types/task";

function task(id: string, title: string, status: TaskStatus, position: number, extra: Partial<Task> = {}): Task {
  return {
    id, projectId: "p", title, description: null, status, priority: "MEDIUM", position,
    dueDate: null, assignee: null, commentCount: 0, createdAt: "", updatedAt: "", ...extra,
  };
}

const tasks = [
  task("1", "Write docs", "TODO", 0),
  task("2", "Fix login bug", "TODO", 1, { priority: "URGENT" }),
  task("3", "Deploy", "IN_PROGRESS", 0),
  task("4", "Celebrate", "DONE", 0),
];

const noop = () => {};

describe("<Board />", () => {
  it("shows the three columns with their cards and counts", () => {
    render(<Board tasks={tasks} matches={() => true} onSelectTask={noop} onCreateTask={noop} onMoveTask={noop} />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByText("Celebrate")).toBeInTheDocument();
  });

  it("hides cards that do not match the filter and shows 'visible/total' counts", () => {
    render(
      <Board tasks={tasks} matches={(t) => t.priority === "URGENT"} onSelectTask={noop} onCreateTask={noop} onMoveTask={noop} />
    );
    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    expect(screen.queryByText("Write docs")).not.toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("creates a task in the column whose add button was used", async () => {
    const onCreateTask = vi.fn();
    const user = userEvent.setup();
    render(<Board tasks={tasks} matches={() => true} onSelectTask={noop} onCreateTask={onCreateTask} onMoveTask={noop} />);

    await user.click(screen.getByRole("button", { name: "Add task to Done" }));
    await user.type(screen.getByPlaceholderText("Task title…"), "Ship v1{Enter}");

    expect(onCreateTask).toHaveBeenCalledWith("DONE", "Ship v1");
  });

  it("opens a task when its card is clicked", async () => {
    const onSelectTask = vi.fn();
    const user = userEvent.setup();
    render(<Board tasks={tasks} matches={() => true} onSelectTask={onSelectTask} onCreateTask={noop} onMoveTask={noop} />);

    await user.click(screen.getByText("Deploy"));
    expect(onSelectTask).toHaveBeenCalledWith("3");
  });

  it("is read-only for archived projects: no add buttons", () => {
    render(<Board tasks={tasks} readOnly matches={() => true} onSelectTask={noop} onCreateTask={noop} onMoveTask={noop} />);
    expect(screen.queryByRole("button", { name: /Add task to/ })).not.toBeInTheDocument();
    expect(within(screen.getByText("Deploy").closest("div")!.parentElement!).getByText("Deploy")).toBeInTheDocument();
  });
});
