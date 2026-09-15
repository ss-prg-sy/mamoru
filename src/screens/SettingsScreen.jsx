import { useState } from "react";
import {
  updateBoardName,
  changePassphrase,
  deleteBoard,
} from "../lib/boards";

export default function SettingsScreen({
  boardId,
  memberId,
  board,
  onChanged,
  onDeleted,
}) {
  const [mode, setMode] = useState("list"); // list / name / passphrase / confirmDelete
  const [nameDraft, setNameDraft] = useState("");
  const [passDraft, setPassDraft] = useState("");
  const [passDraft2, setPassDraft2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isOwner = board && board.ownerMemberId === memberId;

  async function saveName() {
    const value = nameDraft.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await updateBoardName(boardId, value);
      onChanged && onChanged();
      setMode("list");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function savePassphrase() {
    const value = passDraft.trim();
    if (value.length < 2 || value.length > 10) {
      setError("2〜10文字で入力してください");
      return;
    }
    if (value !== passDraft2.trim()) {
      setError("合言葉が一致しません");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await changePassphrase(boardId, board.passphrase, value);
      onChanged && onChanged();
      setMode("list");
    } catch (e) {
      setError(e.message || "エラーが発生しました");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await deleteBoard(boardId, board.passphrase);
      onDeleted();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  }

  // ---------- タスク欄名の変更 ----------
  if (mode === "name") {
    return (
      <div className="screen">
        <div className="header">
          <button className="back" onClick={() => setMode("list")}>
            ‹
          </button>
          <h2>タスク欄の名前</h2>
          <span className="header-spacer" />
        </div>
        <input
          className="input"
          value={nameDraft}
          maxLength={20}
          onChange={(e) => setNameDraft(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={saveName}
          disabled={!nameDraft.trim() || busy}
        >
          保存する
        </button>
      </div>
    );
  }

  // ---------- 合言葉の変更 ----------
  if (mode === "passphrase") {
    return (
      <div className="screen">
        <div className="header">
          <button className="back" onClick={() => setMode("list")}>
            ‹
          </button>
          <h2>合言葉を変える</h2>
          <span className="header-spacer" />
        </div>

        <label className="label">新しい合言葉</label>
        <input
          className="input"
          value={passDraft}
          maxLength={10}
          onChange={(e) => setPassDraft(e.target.value)}
        />
        <p className="hint">2〜10文字（大文字・小文字を区別します）</p>

        <label className="label">新しい合言葉（確認）</label>
        <input
          className="input"
          value={passDraft2}
          maxLength={10}
          onChange={(e) => setPassDraft2(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <p className="hint">
          変えたあとも、いま参加している人はそのまま使えます。
          <br />
          新しく入る人には新しい合言葉を伝えてください。
        </p>

        <button
          className="btn btn-primary"
          onClick={savePassphrase}
          disabled={busy}
        >
          変更する
        </button>
      </div>
    );
  }

  // ---------- 削除の確認 ----------
  if (mode === "confirmDelete") {
    return (
      <div className="screen">
        <div className="dialog">
          <h3>このタスク欄を削除しますか？</h3>
          <p>
            「{board.name}」のタスクとメンバーが<b>全員ぶん消えます</b>。
            <br />
            元に戻すことはできません。
          </p>
          <button className="btn btn-danger" onClick={doDelete} disabled={busy}>
            {busy ? "削除中..." : "完全に削除する"}
          </button>
          <button className="btn btn-outline" onClick={() => setMode("list")}>
            やめる
          </button>
        </div>
      </div>
    );
  }

  // ---------- 一覧 ----------
  return (
    <div className="screen screen-tab">
      <div className="header">
        <h2>設定</h2>
      </div>

      <button
        className={`setting-row ${isOwner ? "" : "disabled"}`}
        disabled={!isOwner}
        onClick={() => {
          setNameDraft(board.name);
          setMode("name");
        }}
      >
        <span className="setting-icon">✎</span>
        <span className="setting-body">
          <span className="setting-label">タスク欄名</span>
          <span className="setting-value">{board ? board.name : ""}</span>
        </span>
        <span className="setting-arrow">›</span>
      </button>

      <button
        className={`setting-row ${isOwner ? "" : "disabled"}`}
        disabled={!isOwner}
        onClick={() => {
          setPassDraft("");
          setPassDraft2("");
          setError("");
          setMode("passphrase");
        }}
      >
        <span className="setting-icon">🔒</span>
        <span className="setting-body">
          <span className="setting-label">合言葉</span>
          <span className="setting-value">{board ? board.passphrase : ""}</span>
        </span>
        <span className="setting-arrow">›</span>
      </button>

      <button
        className={`setting-row danger ${isOwner ? "" : "disabled"}`}
        disabled={!isOwner}
        onClick={() => setMode("confirmDelete")}
      >
        <span className="setting-icon">🗑</span>
        <span className="setting-body">
          <span className="setting-label">タスク欄を削除</span>
        </span>
        <span className="setting-arrow">›</span>
      </button>

      {!isOwner && <p className="hint center">管理者のみ変更できます</p>}
    </div>
  );
}
