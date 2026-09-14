import { useState, useEffect } from "react";
import JoinScreen from "./screens/JoinScreen";
import CreateBoardScreen from "./screens/CreateBoardScreen";
import DisplayNameScreen from "./screens/DisplayNameScreen";
import TaskListScreen from "./screens/TaskListScreen";
import TaskFormScreen from "./screens/TaskFormScreen";
import { getBoard } from "./lib/boards";
import { subscribeTasks } from "./lib/tasks";
import { saveJoinedBoard, getLastBoardId, getMemberId } from "./lib/storage";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [boardId, setBoardId] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);

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

  // 並び順の計算に使うので、ここでもタスクを見ておく
  useEffect(() => {
    if (!boardId) return;
    const stop = subscribeTasks(boardId, setTasks);
    return stop;
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

  if (screen === "taskForm") {
    return (
      <TaskFormScreen
        boardId={boardId}
        memberId={memberId}
        tasks={tasks}
        onDone={() => setScreen("tasks")}
        onCancel={() => setScreen("tasks")}
      />
    );
  }

  return (
    <TaskListScreen
      boardId={boardId}
      memberId={memberId}
      board={board}
      onAddTask={() => setScreen("taskForm")}
    />
  );
}
