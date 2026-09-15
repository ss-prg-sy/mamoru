import { useState, useEffect } from "react";
import { getBoard, getMembers, joinBoard } from "../lib/boards";

export default function DisplayNameScreen({ boardId, onJoined, onBack }) {
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [sameNameMember, setSameNameMember] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setBoard(await getBoard(boardId));
      setMembers(await getMembers(boardId));
    })();
  }, [boardId]);

  function handleStart() {
    const value = displayName.trim();
    if (!value) return;

    const same = members.find((m) => m.displayName === value);
    if (same) {
      setSameNameMember(same);
      return;
    }
    doJoin(value);
  }

  async function doJoin(value) {
    setLoading(true);
    setError("");
    try {
      const memberId = await joinBoard(boardId, value);
      onJoined(memberId);
    } catch (e) {
      setError(e.message || "エラーが発生しました");
      console.error(e);
      setLoading(false);
    }
  }

  function continueAsSame() {
    onJoined(sameNameMember.id);
  }

  if (sameNameMember) {
    return (
      <div className="screen">
        <div className="dialog">
          <h3>{sameNameMember.displayName}さんはすでに参加しています</h3>
          <p>
            同じ人ですか？
            <br />
            機種変更などで入り直した場合は
            <br />
            「{sameNameMember.displayName}として続ける」を選んでください
          </p>
          <button className="btn btn-primary" onClick={continueAsSame}>
            {sameNameMember.displayName}として続ける
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              setSameNameMember(null);
              doJoin(displayName.trim());
            }}
          >
            別の人として参加する
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
      </div>

      <h2 className="board-name">{board ? board.name : "..."}</h2>

      <label className="label">あなたの表示名</label>
      <input
        className="input"
        placeholder="例）たろう"
        value={displayName}
        maxLength={12}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <p className="hint">1〜12文字</p>

      {error && <p className="error">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={!displayName.trim() || loading}
      >
        {loading ? "参加中..." : "はじめる"}
      </button>
    </div>
  );
}
