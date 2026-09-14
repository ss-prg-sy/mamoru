import { useState, useEffect } from "react";
import { getMembers } from "../lib/boards";
import {
  subscribeTasks,
  toggleComplete,
  canComplete,
  isOverdue,
  formatDate,
} from "../lib/tasks";

const PRIORITY_LABEL = { high: "高", medium: "中", low: "低" };

export default function TaskListScreen({
  boardId,
  memberId,
  board,
  onAddTask,
}) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(true);

  // タスクの変更を監視する
  useEffect(() => {
    const stop = subscribeTasks(boardId, (list) => {
      setTasks(list);
      setLoading(false);
    });
    return stop; // 画面を離れるとき監視をやめる
  }, [boardId]);

  // メンバーを取る
  useEffect(() => {
    getMembers(boardId).then(setMembers);
  }, [boardId]);

  function memberName(id) {
    const m = members.find((x) => x.id === id);
    return m ? m.displayName : "退出した人";
  }

  function assigneeText(task) {
    const ids = task.assigneeIds || [];
    if (ids.length === 0) return "みんな";
    return ids.map(memberName).join("・");
  }

  async function handleToggle(task) {
    if (!canComplete(task, memberId)) return;
    try {
      await toggleComplete(boardId, task, memberId);
    } catch (e) {
      console.error(e);
    }
  }

  const visible = tasks.filter((t) =>
    showDone ? t.status === "done" : t.status === "open"
  );

  return (
    <div className="screen screen-list">
      <div className="topbar">
        <div>
          <h2 className="board-title">{board ? board.name : "..."}</h2>
          <p className="member-count">{members.length}人</p>
        </div>
      </div>

      <button
        className="filter-btn"
        onClick={() => setShowDone((v) => !v)}
      >
        {showDone ? "完了を表示中（未完了に戻す）" : "絞り込み"}
      </button>

      <div className="task-list">
        {loading && <p className="hint">読み込み中...</p>}

        {!loading && visible.length === 0 && (
          <div className="empty">
            <p className="empty-title">
              {showDone
                ? "完了したタスクはまだありません"
                : "まだタスクがありません"}
            </p>
            {!showDone && (
              <p className="hint">
                最初のタスクを追加して、
                <br />
                みんなで共有しましょう！
              </p>
            )}
          </div>
        )}

        {visible.map((task) => (
          <div
            key={task.id}
            className={`task-card ${task.status === "done" ? "done" : ""}`}
          >
            <button
              className={`check ${task.status === "done" ? "checked" : ""}`}
              onClick={() => handleToggle(task)}
              disabled={!canComplete(task, memberId)}
              aria-label="完了"
            >
              {task.status === "done" ? "✓" : ""}
            </button>

            <div className="task-body">
              <p className="task-title">{task.title}</p>
              <div className="task-meta">
                <span className={`badge badge-${task.priority}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                {task.dueDate && (
                  <span className={isOverdue(task) ? "due overdue" : "due"}>
                    期限 {formatDate(task.dueDate)}
                  </span>
                )}
                <span className="assignee">{assigneeText(task)}</span>
              </div>
              <p className="creator">作成者：{memberName(task.createdBy)}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-add" onClick={onAddTask}>
        ＋ タスクを追加
      </button>
    </div>
  );
}