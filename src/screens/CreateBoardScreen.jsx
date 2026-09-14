import { useState } from "react";
import { createBoard } from "../lib/boards";

export default function CreateBoardScreen({ onCreated, onBack }) {
  const [name, setName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [passphrase2, setPassphrase2] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    name.trim() &&
    passphrase.trim().length >= 2 &&
    passphrase.trim().length <= 10 &&
    passphrase === passphrase2 &&
    displayName.trim();

  async function handleCreate() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const result = await createBoard(
        name.trim(),
        passphrase.trim(),
        displayName.trim()
      );
      onCreated(result.boardId, result.memberId);
    } catch (e) {
      setError(e.message || "エラーが発生しました");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <div className="header">
        <button className="back" onClick={onBack}>
          ‹
        </button>
        <h2>新しいタスク欄を作る</h2>
      </div>

      <label className="label">タスク欄の名前</label>
      <input
        className="input"
        placeholder="例）サークル合宿"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="label">合言葉</label>
      <input
        className="input"
        placeholder="例）camp2026"
        value={passphrase}
        maxLength={10}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      <p className="hint">2〜10文字（大文字・小文字を区別します）</p>

      <label className="label">合言葉（確認）</label>
      <input
        className="input"
        placeholder="例）2026camp"
        value={passphrase2}
        maxLength={10}
        onChange={(e) => setPassphrase2(e.target.value)}
      />
      {passphrase2 && passphrase !== passphrase2 && (
        <p className="error">合言葉が一致しません</p>
      )}

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
        onClick={handleCreate}
        disabled={!canSubmit || loading}
      >
        {loading ? "作成中..." : "作成する"}
      </button>
    </div>
  );
}