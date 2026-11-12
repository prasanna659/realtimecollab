import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { Column } from "./Column";
import { COLUMN_DEFS } from "../../lib/columns";
import { TaskCard } from "./TaskCard";
import { byColumn, isNoOp, resolveDrop } from "../../lib/boardMath";
import type { Task, TaskStatus } from "../../types/task";

export function Board({ tasks, matches, readOnly = false, onSelectTask, onCreateTask, onMoveTask }: {
  /** Every task in the project. Drop positions are computed against this full list. */
  tasks: Task[];
  /** Which tasks pass the current search/filters. Filtered-out tasks are hidden but still counted. */
  matches: (task: Task) => boolean;
  readOnly?: boolean;
  onSelectTask: (id: string) => void;
  onCreateTask: (status: TaskStatus, title: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || readOnly) return;
    const drop = resolveDrop(tasks, String(active.id), String(over.id));
    if (!drop || isNoOp(tasks, String(active.id), drop)) return;
    onMoveTask(String(active.id), drop.status, drop.position);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex h-full gap-4">
        {COLUMN_DEFS.map((col) => {
          const all = byColumn(tasks, col.id);
          return (
            <Column
              key={col.id}
              status={col.id}
              title={col.title}
              color={col.color}
              accent={col.accent}
              headerBg={col.headerBg}
              tasks={all.filter(matches)}
              totalCount={all.length}
              readOnly={readOnly}
              onSelectTask={onSelectTask}
              onCreateTask={(title) => onCreateTask(col.id, title)}
            />
          );
        })}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} onClick={() => {}} />}</DragOverlay>
    </DndContext>
  );
}
