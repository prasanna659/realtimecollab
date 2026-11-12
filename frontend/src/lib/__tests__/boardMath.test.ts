import { describe, expect, it } from "vitest";
import { applyMove, isNoOp, resolveDrop } from "../boardMath";
import type { Task, TaskStatus } from "../../types/task";

function task(id: string, status: TaskStatus, position: number): Task {
  return {
    id, projectId: "p", title: id, description: null, status, priority: "MEDIUM",
    position, dueDate: null, assignee: null, commentCount: 0, createdAt: "", updatedAt: "",
  };
}

const board = [
  task("a", "TODO", 0), task("b", "TODO", 1), task("c", "TODO", 2),
  task("x", "IN_PROGRESS", 0), task("y", "IN_PROGRESS", 1),
];

const order = (tasks: Task[], status: TaskStatus) =>
  tasks.filter((t) => t.status === status).sort((p, q) => p.position - q.position).map((t) => t.id);

describe("resolveDrop + applyMove", () => {
  it("dragging a card DOWN within its column puts it after the card it was dropped on", () => {
    const drop = resolveDrop(board, "a", "c")!;
    expect(order(applyMove(board, "a", drop.status, drop.position), "TODO")).toEqual(["b", "c", "a"]);
  });

  it("dragging a card UP within its column puts it before the card it was dropped on", () => {
    const drop = resolveDrop(board, "c", "a")!;
    expect(order(applyMove(board, "c", drop.status, drop.position), "TODO")).toEqual(["c", "a", "b"]);
  });

  it("dropping on another column's card inserts before it and renumbers both columns", () => {
    const drop = resolveDrop(board, "a", "y")!;
    const moved = applyMove(board, "a", drop.status, drop.position);
    expect(order(moved, "IN_PROGRESS")).toEqual(["x", "a", "y"]);
    expect(order(moved, "TODO")).toEqual(["b", "c"]);
    expect(moved.filter((t) => t.status === "TODO").map((t) => t.position)).toEqual([0, 1]);
  });

  it("dropping on a column body appends to the end", () => {
    const drop = resolveDrop(board, "a", "DONE")!;
    expect(drop).toEqual({ status: "DONE", position: 0 });
    expect(order(applyMove(board, "a", "DONE", 0), "DONE")).toEqual(["a"]);
    const toProgress = resolveDrop(board, "a", "IN_PROGRESS")!;
    expect(toProgress.position).toBe(2);
  });

  it("dropping on the column body of its own column moves it to the end", () => {
    const drop = resolveDrop(board, "a", "TODO")!;
    expect(order(applyMove(board, "a", drop.status, drop.position), "TODO")).toEqual(["b", "c", "a"]);
  });

  it("clamps an out-of-range position and ignores unknown ids", () => {
    expect(order(applyMove(board, "a", "TODO", 99), "TODO")).toEqual(["b", "c", "a"]);
    expect(applyMove(board, "nope", "TODO", 0)).toBe(board);
    expect(resolveDrop(board, "a", "ghost")).toBeNull();
    expect(resolveDrop(board, "ghost", "b")).toBeNull();
  });

  it("detects a drop that changes nothing", () => {
    expect(isNoOp(board, "b", { status: "TODO", position: 1 })).toBe(true);
    expect(isNoOp(board, "b", { status: "TODO", position: 2 })).toBe(false);
    expect(isNoOp(board, "b", { status: "DONE", position: 0 })).toBe(false);
  });

  it("does not mutate its input", () => {
    const copy = JSON.stringify(board);
    applyMove(board, "a", "DONE", 0);
    expect(JSON.stringify(board)).toBe(copy);
  });
});
