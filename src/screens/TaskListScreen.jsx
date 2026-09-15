import { useState, useEffect } from "react";
import { getMembers } from "../lib/boards";
import {
  toggleComplete,
  canComplete,
  isOverdue,
  formatDate,
  applyFilter,
  isFiltered,
  DEFAULT_FILTER,
} from "../lib/tasks";
import FilterSheet from "./FilterSheet";

const PRIORITY_LABEL = { high: "高", medium: "中", low: "低" };

export default function TaskListScreen({
  boardId,
  memberId,
  board,
  tasks,
  loading,
  filter,
  onChangeFilter,
  onAddTask,
  onOpenTask,
  onReorder,
  onSwitchBoard,
}) {
  const [members, setMembers] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getMembers(boardId).then(setMembers);
  }, [boardId, tasks.length]);

  function memberName(id) {
    const m = members.find((x) => x.id === id);
    return m ? m.displayName : "退出した人";
  }

  function assigneeText(task) {
    const ids = task.assigneeIds || [];
    if (ids.length === 0) return "みんな";
    return ids.map(memberName).join("・");
  }

  async function handleToggle(e, task) {
    e.stopPropagation();
    if (!canComplete(task, memberId)) return;
    try {
      await toggleComplete(boardId, task, memberId);
    } catch (err) {
      console.error(err);
    }
  }

  function filterText() {
    const parts = [];
    if (filter.status === "done") parts.push("完了");
    else if (filter.status === "both") parts.push("すべての状態");
    if (filter.assignee === "mine") parts.push("自分あて");
    else if (filter.assignee !== "all")
      parts.push(memberName(filter.assignee));
    return parts.join("・");
  }

  const visible = applyFilter(tasks, filter, memberId);
  const filtered = isFiltered(filter);

  return (
    <div className="screen screen-list">
      <div className="topbar">
        <div>
          <button className="board-switch" onClick={onSwitchBoard}>
            <h2 className="board-title">{board ? board.name : "..."}</h2>
            <span className="chevron">⌄</span>
          </button>
          <p className="member-count">{members.length}人</p>
        </div>
        <div className="menu-wrap">
          <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)}>
            ⋮
          </button>
          {menuOpen && (
            <>
              <div
                className="menu-backdrop"
                onClick={() => setMenuOpen(false)}
              />
              <div className="menu">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReorder();
                  }}
                >
                  ↑↓ 並び替え
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="filter-row">
        <button
          className={`filter-btn ${filtered ? "on" : ""}`}
          onClick={() => setSheetOpen(true)}
        >
          ▽ {filtered ? filterText() : "絞り込み"}
        </button>
        {filtered && (
          <button
            className="filter-clear"
            onClick={() => onChangeFilter(DEFAULT_FILTER)}
          >
            ✕
          </button>
        )}
      </div>

      <div className="task-list">
        {loading && <p className="hint">読み込み中...</p>}

        {!loading && visible.length === 0 && (
          <div className="empty">
            <p className="empty-title">
              {filtered
                ? "条件に合うタスクがありません"
                : "まだタスクがありません"}
            </p>
            {filtered ? (
              <button
                className="btn btn-outline"
                onClick={() => onChangeFilter(DEFAULT_FILTER)}
              >
                絞り込みを解除
              </button>
            ) : (
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
            onClick={() => onOpenTask(task.id)}
          >
            <button
              className={`check ${task.status === "done" ? "checked" : ""}`}
              onClick={(e) => handleToggle(e, task)}
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

      {sheetOpen && (
        <FilterSheet
          members={members}
          memberId={memberId}
          filter={filter}
          onApply={(f) => {
            onChangeFilter(f);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
