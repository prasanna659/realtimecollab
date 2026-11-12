import type { Task, TaskStatus } from "../types/task";

export const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function byColumn(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
}

/**
 * Applies a move to a task list exactly the way the server does (TaskService.move):
 * the task is taken out, inserted at `position` in the target column, and both columns
 * are renumbered 0..n-1. Used for the optimistic update so the board never flickers.
 */
export function applyMove(tasks: Task[], taskId: string, status: TaskStatus, position: number): Task[] {
  const moving = tasks.find((t) => t.id === taskId);
  if (!moving) return tasks;

  const others = tasks.filter((t) => t.id !== taskId);
  const target = byColumn(others, status);
  const insertAt = Math.max(0, Math.min(position, target.length));
  const newTarget = [...target.slice(0, insertAt), { ...moving, status }, ...target.slice(insertAt)];

  const next = new Map<string, Task>();
  newTarget.forEach((t, i) => next.set(t.id, { ...t, position: i }));
  if (moving.status !== status) {
    byColumn(others, moving.status).forEach((t, i) => next.set(t.id, { ...t, position: i }));
  }
  return tasks.map((t) => next.get(t.id) ?? t);
}

/**
 * Works out where a dropped card should go. `overId` is either a column id (dropped on the
 * column body, so: the end) or another card's id (dropped on that card).
 * Within a column the card takes the index of the card it was dropped on, which is also what
 * dnd-kit's arrayMove does, so dragging down by one slot really moves it down by one.
 * Into another column it is inserted before the card it was dropped on.
 */
export function resolveDrop(
  tasks: Task[],
  activeId: string,
  overId: string
): { status: TaskStatus; position: number } | null {
  const active = tasks.find((t) => t.id === activeId);
  if (!active) return null;

  if (STATUSES.includes(overId as TaskStatus)) {
    const status = overId as TaskStatus;
    return { status, position: byColumn(tasks, status).filter((t) => t.id !== activeId).length };
  }

  const over = tasks.find((t) => t.id === overId);
  if (!over) return null;
  return { status: over.status, position: byColumn(tasks, over.status).findIndex((t) => t.id === overId) };
}

/** True when the drop would leave the card exactly where it already is. */
export function isNoOp(tasks: Task[], activeId: string, drop: { status: TaskStatus; position: number }): boolean {
  const active = tasks.find((t) => t.id === activeId);
  if (!active || active.status !== drop.status) return false;
  return byColumn(tasks, active.status).findIndex((t) => t.id === activeId) === drop.position;
}
