import { useState } from "react";
import { findBoardByPassphrase } from "../lib/boards";

export default function JoinScreen({ onFound, onCreateNew, onBack }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const value = passphrase.trim();
    if (!value) return;

    setLoading(true);
    setError("");
    try {
      const boardId = await findBoardByPassphrase(value);
      if (!boardId) {
        setError("合言葉が違います");
        return;
      }
      onFound(boardId);
    } catch (e) {
      setError("エラーが発生しました");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen join-screen">
      {onBack && (
        <button className="corner-back" onClick={onBack}>
          ‹ 戻る
        </button>
      )}

      <div className="join-logo">✓</div>
      <h1 className="join-title">マモル</h1>
      <p className="join-sub">
        みんなのやることを
        <br />
        ひとつの場所で。
      </p>

      <input
        className="input"
        type="text"
        placeholder="合言葉を入力"
        value={passphrase}
        maxLength={10}
        onChange={(e) => setPassphrase(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
      />

      {error && <p className="error">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleJoin}
        disabled={loading || !passphrase.trim()}
      >
        {loading ? "確認中..." : "参加する"}
      </button>

      <p className="note">
        合言葉を知っている人だけが
        <br />
        このタスク欄に参加できます。
      </p>

      <button className="btn btn-outline" onClick={onCreateNew}>
        新しくタスク欄を作る
      </button>
    </div>
  );
}
