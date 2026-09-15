import { useState } from "react";
import { DEFAULT_FILTER } from "../lib/tasks";

export default function FilterSheet({
  members,
  memberId,
  filter,
  onApply,
  onClose,
}) {
  const [draft, setDraft] = useState(filter);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>絞り込み</h3>
          <button className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="sheet-label">状態</p>
        <div className="segment">
          {[
            ["open", "未完了のみ"],
            ["done", "完了のみ"],
            ["both", "両方"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`seg ${draft.status === value ? "seg-on" : ""}`}
              onClick={() => setDraft({ ...draft, status: value })}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="sheet-label">担当者</p>
        <div className="assignees">
          <button
            className={`chip ${draft.assignee === "all" ? "selected" : ""}`}
            onClick={() => setDraft({ ...draft, assignee: "all" })}
          >
            指定なし
          </button>
          <button
            className={`chip ${draft.assignee === "mine" ? "selected" : ""}`}
            onClick={() => setDraft({ ...draft, assignee: "mine" })}
          >
            自分あて
          </button>
          {members
            .filter((m) => m.id !== memberId)
            .map((m) => (
              <button
                key={m.id}
                className={`chip ${
                  draft.assignee === m.id ? "selected" : ""
                }`}
                onClick={() => setDraft({ ...draft, assignee: m.id })}
              >
                {m.displayName}
              </button>
            ))}
        </div>

        <button
          className="btn btn-outline"
          onClick={() => setDraft(DEFAULT_FILTER)}
        >
          絞り込みを解除
        </button>
        <button className="btn btn-primary" onClick={() => onApply(draft)}>
          この条件で見る
        </button>
      </div>
    </div>
  );
}
