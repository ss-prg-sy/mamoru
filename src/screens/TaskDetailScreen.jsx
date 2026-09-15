import { useState, useEffect } from "react";
import { getMembers } from "../lib/boards";
import {
  toggleComplete,
  canComplete,
  canEdit,
  isOverdue,
  formatDate,
  formatDateTime,
} from "../lib/tasks";

const PRIORITY_LABEL = { high: "高", medium: "中", low: "低" };

export default function TaskDetailScreen({
  boardId,
  memberId,
  task,
  onBack,
  onEdit,
  onDelete,
}) {
  const [members, setMembers] = useState([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getMembers(boardId).then(setMembers);
  }, [boardId]);

  // 他の人に消された場合
  if (!task) {
    return (
      <div className="screen">
        <div className="header">
          <button className="back" onClick={onBack}>
            ‹
          </button>
        </div>
        <p className="empty-title">このタスクは削除されました</p>
        <button className="btn btn-outline" onClick={onBack}>
          一覧に戻る
        </button>
      </div>
    );
  }

  function memberName(id) {
    const m = members.find((x) => x.id === id);
    return m ? m.displayName : "退出した人";
  }

  function assigneeText() {
    const ids = task.assigneeIds || [];
    if (ids.length === 0) return "みんな";
    return ids.map(memberName).join("・");
  }

  const mine = canEdit(task, memberId);
  const completable = canComplete(task, memberId);

  async function handleToggle() {
    if (!completable) return;
    try {
      await toggleComplete(boardId, task, memberId);
      onBack();
    } catch (e) {
      console.error(e);
    }
  }

  if (confirming) {
    return (
      <div className="screen">
        <div className="dialog">
          <h3>このタスクを削除しますか？</h3>
          <p>
            「{task.title}」を削除します。
            <br />
            削除した直後なら元に戻せます。
          </p>
          <button
            className="btn btn-danger"
            onClick={() => onDelete(task)}
          >
            削除する
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setConfirming(false)}
          >
            やめる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="header">
        <button className="back" onClick={onBack}>
          ‹
        </button>
        <h2>タスク詳細</h2>
        {mine ? (
          <button className="header-action" onClick={() => onEdit(task)}>
            編集
          </button>
        ) : (
          <span className="header-spacer" />
        )}
      </div>

      <h3 className="detail-title">{task.title}</h3>
      <span className={`badge badge-${task.priority}`}>
        {PRIORITY_LABEL[task.priority]}
      </span>

      <div className="detail-rows">
        {task.dueDate && (
          <div className="detail-row">
            <span className="detail-label">期限</span>
            <span className={isOverdue(task) ? "overdue" : ""}>
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">担当者</span>
          <span>{assigneeText()}</span>
        </div>

        {task.description && (
          <div className="detail-row detail-row-block">
            <span className="detail-label">詳細</span>
            <p className="detail-desc">{task.description}</p>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">作成者</span>
          <span>
            {memberName(task.createdBy)}
            {mine && "（自分）"}
          </span>
        </div>

        {task.createdAt && (
          <div className="detail-row">
            <span className="detail-label">作成日</span>
            <span>{formatDateTime(task.createdAt)}</span>
          </div>
        )}

        {task.status === "done" && task.completedAt && (
          <div className="detail-row">
            <span className="detail-label">完了日</span>
            <span>{formatDateTime(task.completedAt)}</span>
          </div>
        )}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleToggle}
        disabled={!completable}
      >
        {task.status === "done" ? "未完了に戻す" : "✓ 完了にする"}
      </button>

      {!completable && (
        <p className="hint center">
          担当者か作成者だけが完了にできます
        </p>
      )}

      {mine && (
        <button className="btn btn-text" onClick={() => setConfirming(true)}>
          🗑 削除
        </button>
      )}
    </div>
  );
}
