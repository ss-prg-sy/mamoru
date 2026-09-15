import { useState, useEffect } from "react";
import { getJoinedBoardsInfo } from "../lib/boards";
import { getJoinedBoards } from "../lib/storage";

export default function BoardSwitchSheet({
  currentBoardId,
  onSwitch,
  onJoinOther,
  onCreateNew,
  onClose,
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJoinedBoardsInfo(getJoinedBoards())
      .then((r) => {
        setList(r);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>タスク欄を切り替え</h3>
          <button className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && <p className="hint">読み込み中...</p>}

        {list.map((b) => (
          <button
            key={b.boardId}
            className="switch-row"
            onClick={() => onSwitch(b.boardId, b.memberId)}
          >
            <span className="switch-name">
              {b.name}（{b.memberCount}人）
            </span>
            {b.boardId === currentBoardId && (
              <span className="switch-check">✓</span>
            )}
          </button>
        ))}

        <div className="sheet-divider" />

        <button className="switch-row add" onClick={onJoinOther}>
          ＋ 別のタスク欄に参加する
        </button>
        <button className="switch-row add" onClick={onCreateNew}>
          ＋ 新しくタスク欄を作る
        </button>
      </div>
    </div>
  );
}
