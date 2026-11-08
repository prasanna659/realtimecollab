import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useState } from "react";
import { Column, COLUMN_DEFS } from "./Column";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "../../types/task";

export function Board({ tasks, onSelectTask, onCreateTask, onMoveTask }: {
  tasks: Task[];
  onSelectTask: (id: string) => void;
  onCreateTask: (status: TaskStatus, title: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const byStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const overIsColumn = COLUMN_DEFS.some((c) => c.id === over.id);
    const targetStatus: TaskStatus = overIsColumn
      ? (over.id as TaskStatus)
      : tasks.find((t) => t.id === over.id)!.status;
    const targetList = byStatus(targetStatus).filter((t) => t.id !== taskId);
    const overIndex = overIsColumn ? targetList.length : targetList.findIndex((t) => t.id === over.id);
    const newPosition = overIndex === -1 ? targetList.length : overIndex;
    if (targetStatus === task.status && newPosition === task.position) return;
    onMoveTask(taskId, targetStatus, newPosition);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex h-full gap-4">
        {COLUMN_DEFS.map((col) => (
          <Column
            key={col.id}
            status={col.id}
            title={col.title}
            color={col.color}
            accent={col.accent}
            headerBg={col.headerBg}
            tasks={byStatus(col.id)}
            onSelectTask={onSelectTask}
            onCreateTask={(title) => onCreateTask(col.id, title)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}
