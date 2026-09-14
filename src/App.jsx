import { useState, useEffect } from "react";
import JoinScreen from "./screens/JoinScreen";
import CreateBoardScreen from "./screens/CreateBoardScreen";
import DisplayNameScreen from "./screens/DisplayNameScreen";
import { getBoard } from "./lib/boards";
import {
  saveJoinedBoard,
  getLastBoardId,
  getMemberId,
} from "./lib/storage";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [boardId, setBoardId] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [board, setBoard] = useState(null);

  // 起動時、前回のタスク欄があれば開く
  useEffect(() => {
    const last = getLastBoardId();
    if (!last) {
      setScreen("join");
      return;
    }
    const mid = getMemberId(last);
    if (!mid) {
      setScreen("join");
      return;
    }
    setBoardId(last);
    setMemberId(mid);
    setScreen("tasks");
  }, []);

  // タスク欄の情報を取る
  useEffect(() => {
    if (!boardId) return;
    getBoard(boardId).then(setBoard);
  }, [boardId]);

  function handleFound(id) {
    const existing = getMemberId(id);
    if (existing) {
      setBoardId(id);
      setMemberId(existing);
      setScreen("tasks");
    } else {
      setBoardId(id);
      setScreen("displayName");
    }
  }

  function handleJoined(mid) {
    saveJoinedBoard(boardId, mid);
    setMemberId(mid);
    setScreen("tasks");
  }

  function handleCreated(bid, mid) {
    saveJoinedBoard(bid, mid);
    setBoardId(bid);
    setMemberId(mid);
    setScreen("tasks");
  }

  if (screen === "loading") {
    return <div className="screen">読み込み中...</div>;
  }

  if (screen === "join") {
    return (
      <JoinScreen
        onFound={handleFound}
        onCreateNew={() => setScreen("create")}
      />
    );
  }

  if (screen === "create") {
    return (
      <CreateBoardScreen
        onCreated={handleCreated}
        onBack={() => setScreen("join")}
      />
    );
  }

  if (screen === "displayName") {
    return (
      <DisplayNameScreen
        boardId={boardId}
        onJoined={handleJoined}
        onBack={() => setScreen("join")}
      />
    );
  }

  // タスク一覧は次に作る。今は確認用の仮置き
  return (
    <div className="screen">
      <h2>{board ? board.name : "..."}</h2>
      <p className="hint">タスク欄ID: {boardId}</p>
      <p className="hint">あなたのメンバーID: {memberId}</p>
      <p>参加できました。タスク一覧はこれから作ります。</p>
    </div>
  );
}