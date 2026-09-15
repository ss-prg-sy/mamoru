import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { reorderTasks } from "../lib/tasks";

const PRIORITY_LABEL = { high: "高", medium: "中", low: "低" };

function Row({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="reorder-row"
      {...attributes}
      {...listeners}
    >
      <span className="grip">⋮⋮</span>
      <span className="reorder-title">{task.title}</span>
      <span className={`badge badge-${task.priority}`}>
        {PRIORITY_LABEL[task.priority]}
      </span>
    </div>
  );
}

export default function ReorderScreen({ boardId, tasks, onDone, onCancel }) {
  const open = tasks.filter((t) => t.status === "open");
  const [items, setItems] = useState(open);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((t) => t.id === active.id);
      const to = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, from, to);
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await reorderTasks(
        boardId,
        items.map((t) => t.id)
      );
      onDone();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <div className="header">
        <button className="back" onClick={onCancel}>
          ‹
        </button>
        <h2>並び替え</h2>
        <button
          className="header-action"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "..." : "保存"}
        </button>
      </div>

      <p className="hint center">
        タスクをドラッグして並び替えてください
        <br />
        （未完了のタスクのみ表示されています）
      </p>

      {items.length === 0 && (
        <p className="empty-title center">並び替えるタスクがありません</p>
      )}

      <div className="reorder-list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((task) => (
              <Row key={task.id} task={task} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
