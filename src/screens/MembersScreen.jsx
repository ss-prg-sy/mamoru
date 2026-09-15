import { useState, useEffect } from "react";
import {
  getMembers,
  updateMemberName,
  removeMember,
  transferOwner,
} from "../lib/boards";

export default function MembersScreen({
  boardId,
  memberId,
  board,
  onLeave,
  onChanged,
}) {
  const [members, setMembers] = useState([]);
  const [mode, setMode] = useState("list"); // list / rename / transfer / confirmRemove
  const [nameDraft, setNameDraft] = useState("");
  const [target, setTarget] = useState(null);
  const [pickedOwner, setPickedOwner] = useState(null);
  const [busy, setBusy] = useState(false);

  const isOwner = board && board.ownerMemberId === memberId;

  async function load() {
    setMembers(await getMembers(boardId));
  }

  useEffect(() => {
    load();
  }, [boardId]);

  function memberName(id) {
    const m = members.find((x) => x.id === id);
    return m ? m.displayName : "退出した人";
  }

  // 表示名を変える
  async function saveName() {
    const value = nameDraft.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await updateMemberName(boardId, memberId, value);
      await load();
      onChanged && onChanged();
      setMode("list");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  // メンバーを外す
  async function doRemove() {
    if (busy) return;
    setBusy(true);
    try {
      await removeMember(boardId, target.id);
      await load();
      setMode("list");
      setTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  // 退出する
  async function doLeave() {
    if (busy) return;
    setBusy(true);
    try {
      if (isOwner && members.length > 1) {
        if (!pickedOwner) {
          setBusy(false);
          return;
        }
        await transferOwner(boardId, pickedOwner);
      }
      await removeMember(boardId, memberId);
      onLeave();
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  }

  function handleLeaveTap() {
    if (isOwner && members.length > 1) {
      setMode("transfer");
    } else {
      setMode("confirmLeave");
    }
  }

  // ---------- 表示名の変更 ----------
  if (mode === "rename") {
    return (
      <div className="screen">
        <div className="header">
          <button className="back" onClick={() => setMode("list")}>
            ‹
          </button>
          <h2>表示名を変える</h2>
          <span className="header-spacer" />
        </div>
        <label className="label">あなたの表示名</label>
        <input
          className="input"
          value={nameDraft}
          maxLength={12}
          onChange={(e) => setNameDraft(e.target.value)}
        />
        <p className="hint">1〜12文字</p>
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

  // ---------- 管理者の引き継ぎ ----------
  if (mode === "transfer") {
    return (
      <div className="screen">
        <div className="header">
          <button className="back" onClick={() => setMode("list")}>
            ‹
          </button>
          <h2>管理者の引き継ぎ</h2>
          <span className="header-spacer" />
        </div>

        <h3 className="detail-title">管理者を引き継いでください</h3>
        <p className="hint">退出する前に、次の管理者を選んでください</p>

        <div className="member-list">
          {members
            .filter((m) => m.id !== memberId)
            .map((m) => (
              <button
                key={m.id}
                className={`member-row pick ${
                  pickedOwner === m.id ? "picked" : ""
                }`}
                onClick={() => setPickedOwner(m.id)}
              >
                <span className="radio">
                  {pickedOwner === m.id ? "●" : "○"}
                </span>
                <span className="member-name">{m.displayName}</span>
              </button>
            ))}
        </div>

        <p className="hint">
          この操作をすると、あなたはこのタスク欄から退出します。
        </p>
        <button
          className="btn btn-primary"
          onClick={doLeave}
          disabled={!pickedOwner || busy}
        >
          引き継いで退出する
        </button>
      </div>
    );
  }

  // ---------- 退出の確認 ----------
  if (mode === "confirmLeave") {
    return (
      <div className="screen">
        <div className="dialog">
          <h3>このタスク欄から退出しますか？</h3>
          <p>
            あなたが作ったタスクは残りますが、作成者は「退出した人」と表示されます。
            <br />
            もう一度入るには合言葉が必要です。
          </p>
          <button className="btn btn-danger" onClick={doLeave} disabled={busy}>
            退出する
          </button>
          <button className="btn btn-outline" onClick={() => setMode("list")}>
            やめる
          </button>
        </div>
      </div>
    );
  }

  // ---------- メンバーを外す確認 ----------
  if (mode === "confirmRemove" && target) {
    return (
      <div className="screen">
        <div className="dialog">
          <h3>{target.displayName}さんを外しますか？</h3>
          <p>
            この人が作ったタスクは残ります。担当者からは外れます。
          </p>
          <button className="btn btn-danger" onClick={doRemove} disabled={busy}>
            外す
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              setMode("list");
              setTarget(null);
            }}
          >
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
        <h2>メンバー</h2>
      </div>

      <div className="member-list">
        {members.map((m) => {
          const me = m.id === memberId;
          const owner = board && board.ownerMemberId === m.id;
          return (
            <div key={m.id} className="member-row">
              <span className="avatar">{m.displayName.slice(0, 1)}</span>
              <span className="member-name">
                {m.displayName}
                {me && "（自分）"}
              </span>
              {owner && <span className="owner-tag">👑 管理者</span>}
              {me && (
                <button
                  className="row-action"
                  onClick={() => {
                    setNameDraft(m.displayName);
                    setMode("rename");
                  }}
                >
                  名前を変える ›
                </button>
              )}
              {!me && isOwner && (
                <button
                  className="row-action danger"
                  onClick={() => {
                    setTarget(m);
                    setMode("confirmRemove");
                  }}
                >
                  外す
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn-text" onClick={handleLeaveTap}>
        このタスク欄から退出する
      </button>
    </div>
  );
}
