import { useState, useEffect } from "react";
import { getMembers } from "../lib/boards";
import {
  addTask,
  updateTask,
  nextOrderIndex,
  ensureCapacity,
  MAX_TASKS,
} from "../lib/tasks";

export default function TaskFormScreen({
  boardId,
  memberId,
  tasks,
  task,
  onDone,
  onCancel,
}) {
  const editing = Boolean(task);

  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState(task ? task.title : "");
  const [description, setDescription] = useState(
    task ? task.description || "" : ""
  );
  const [dueDate, setDueDate] = useState(task ? task.dueDate || "" : "");
  const [priority, setPriority] = useState(task ? task.priority : "medium");
  const [assigneeIds, setAssigneeIds] = useState(
    task ? task.assigneeIds || [] : []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMembers(boardId).then(setMembers);
  }, [boardId]);

  function toggleAssignee(id) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        priority,
        assigneeIds,
      };
      if (editing) {
        await updateTask(boardId, task.id, input);
      } else {
        // 100件に達していたら古い完了タスクを消して空ける
        await ensureCapacity(boardId, tasks);
        await addTask(boardId, memberId, input, nextOrderIndex(tasks));
      }
      onDone();
    } catch (e) {
      setError(e.message || "エラーが発生しました");
      console.error(e);
      setSaving(false);
    }
  }

  const myName = members.find((m) => m.id === memberId)?.displayName || "";

  return (
    <div className="screen">
      <div className="header">
        <button className="back" onClick={onCancel}>
          ✕
        </button>
        <h2>{editing ? "タスクを編集" : "タスクを追加"}</h2>
        <button
          className="header-action"
          onClick={handleSave}
          disabled={!title.trim() || saving}
        >
          {saving ? "..." : editing ? "保存" : "追加"}
        </button>
      </div>

      <label className="label">タスク名 *</label>
      <input
        className="input"
        placeholder="例）買い出し（飲み物・食材）"
        value={title}
        maxLength={60}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p className="counter">{title.length}/60</p>

      <label className="label">詳細（任意）</label>
      <textarea
        className="input textarea"
        placeholder="タスクの詳細を入力..."
        value={description}
        maxLength={500}
        rows={4}
        onChange={(e) => setDescription(e.target.value)}
      />
      <p className="counter">{description.length}/500</p>

      <label className="label">期限（任意）</label>
      <input
        className="input"
        type="date"
        value={dueDate || ""}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <label className="label">優先度</label>
      <div className="segment">
        {[
          ["high", "高"],
          ["medium", "中"],
          ["low", "低"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`seg seg-${value} ${
              priority === value ? "selected" : ""
            }`}
            onClick={() => setPriority(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="label">担当者（任意・複数選択可）</label>
      <div className="assignees">
        <button
          className={`chip ${assigneeIds.length === 0 ? "selected" : ""}`}
          onClick={() => setAssigneeIds([])}
        >
          みんな
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            className={`chip ${assigneeIds.includes(m.id) ? "selected" : ""}`}
            onClick={() => toggleAssignee(m.id)}
          >
            {m.displayName}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {!editing && (
        <p className="hint">
          作成者：{myName}　／　{tasks.length}/{MAX_TASKS}件
        </p>
      )}
    </div>
  );
}
