import { useState, useEffect, useRef } from "react";
import JoinScreen from "./screens/JoinScreen";
import CreateBoardScreen from "./screens/CreateBoardScreen";
import DisplayNameScreen from "./screens/DisplayNameScreen";
import TaskListScreen from "./screens/TaskListScreen";
import TaskFormScreen from "./screens/TaskFormScreen";
import TaskDetailScreen from "./screens/TaskDetailScreen";
import ReorderScreen from "./screens/ReorderScreen";
import MembersScreen from "./screens/MembersScreen";
import SettingsScreen from "./screens/SettingsScreen";
import BoardSwitchSheet from "./screens/BoardSwitchSheet";
import TabBar from "./screens/TabBar";
import { getBoard } from "./lib/boards";
import {
  subscribeTasks,
  deleteTask,
  restoreTask,
  DEFAULT_FILTER,
} from "./lib/tasks";
import {
  saveJoinedBoard,
  getLastBoardId,
  getMemberId,
  removeJoinedBoard,
  setLastBoardId,
} from "./lib/storage";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [boardId, setBoardId] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [deletedTask, setDeletedTask] = useState(null);
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [switchOpen, setSwitchOpen] = useState(false);
  const timerRef = useRef(null);

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

  async function reloadBoard() {
    if (!boardId) return;
    setBoard(await getBoard(boardId));
  }

  useEffect(() => {
    if (!boardId) return;
    getBoard(boardId).then(setBoard);
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    setTasksLoading(true);
    const stop = subscribeTasks(boardId, (list) => {
      setTasks(list);
      setTasksLoading(false);
    });
    return stop;
  }, [boardId]);

  function backToJoin() {
    if (boardId) removeJoinedBoard(boardId);
    setBoardId(null);
    setMemberId(null);
    setBoard(null);
    setTasks([]);
    setFilter(DEFAULT_FILTER);
    setScreen("join");
  }

  // タスク欄を切り替える
  function switchBoard(bid, mid) {
    setSwitchOpen(false);
    if (bid === boardId) return;
    setBoardId(bid);
    setMemberId(mid);
    setBoard(null);
    setTasks([]);
    setFilter(DEFAULT_FILTER);
    setLastBoardId(bid);
    setScreen("tasks");
  }

  function handleFound(id) {
    const existing = getMemberId(id);
    if (existing) {
      setBoardId(id);
      setMemberId(existing);
      setLastBoardId(id);
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
    setTasks([]);
    setFilter(DEFAULT_FILTER);
    setScreen("tasks");
  }

  // 削除して「元に戻す」を出す
  async function handleDelete(task) {
    try {
      await deleteTask(boardId, task.id);
      setScreen("tasks");
      setSelectedTaskId(null);
      setDeletedTask(task);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setDeletedTask(null), 5000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUndo() {
    if (!deletedTask) return;
    const task = deletedTask;
    setDeletedTask(null);
    clearTimeout(timerRef.current);
    try {
      await restoreTask(boardId, task);
    } catch (e) {
      console.error(e);
    }
  }

  const toast = deletedTask && (
    <div className="toast">
      <span>タスクを削除しました</span>
      <button onClick={handleUndo}>元に戻す</button>
    </div>
  );

  const tabBar = <TabBar current={screen} onChange={(key) => setScreen(key)} />;

  if (screen === "loading") {
    return <div className="screen">読み込み中...</div>;
  }

  if (screen === "join") {
    return (
      <JoinScreen
        onFound={handleFound}
        onCreateNew={() => setScreen("create")}
        onBack={boardId ? () => setScreen("tasks") : null}
      />
    );
  }

  if (screen === "create") {
    return (
      <CreateBoardScreen
        onCreated={handleCreated}
        onBack={() => setScreen(boardId ? "tasks" : "join")}
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
        task={editingTask}
        onDone={() => {
          setEditingTask(null);
          setScreen(selectedTaskId ? "taskDetail" : "tasks");
        }}
        onCancel={() => {
          setEditingTask(null);
          setScreen(selectedTaskId ? "taskDetail" : "tasks");
        }}
      />
    );
  }

  if (screen === "reorder") {
    return (
      <ReorderScreen
        boardId={boardId}
        tasks={tasks}
        onDone={() => setScreen("tasks")}
        onCancel={() => setScreen("tasks")}
      />
    );
  }

  if (screen === "taskDetail") {
    return (
      <>
        <TaskDetailScreen
          boardId={boardId}
          memberId={memberId}
          task={tasks.find((t) => t.id === selectedTaskId)}
          onBack={() => {
            setSelectedTaskId(null);
            setScreen("tasks");
          }}
          onEdit={(t) => {
            setEditingTask(t);
            setScreen("taskForm");
          }}
          onDelete={handleDelete}
        />
        {toast}
      </>
    );
  }

  if (screen === "members") {
    return (
      <>
        <MembersScreen
          boardId={boardId}
          memberId={memberId}
          board={board}
          onLeave={backToJoin}
          onChanged={reloadBoard}
        />
        {tabBar}
      </>
    );
  }

  if (screen === "settings") {
    return (
      <>
        <SettingsScreen
          boardId={boardId}
          memberId={memberId}
          board={board}
          onChanged={reloadBoard}
          onDeleted={backToJoin}
        />
        {tabBar}
      </>
    );
  }

  return (
    <>
      <TaskListScreen
        boardId={boardId}
        memberId={memberId}
        board={board}
        tasks={tasks}
        loading={tasksLoading}
        filter={filter}
        onChangeFilter={setFilter}
        onAddTask={() => {
          setEditingTask(null);
          setSelectedTaskId(null);
          setScreen("taskForm");
        }}
        onOpenTask={(id) => {
          setSelectedTaskId(id);
          setScreen("taskDetail");
        }}
        onReorder={() => setScreen("reorder")}
        onSwitchBoard={() => setSwitchOpen(true)}
      />
      {switchOpen && (
        <BoardSwitchSheet
          currentBoardId={boardId}
          onSwitch={switchBoard}
          onJoinOther={() => {
            setSwitchOpen(false);
            setScreen("join");
          }}
          onCreateNew={() => {
            setSwitchOpen(false);
            setScreen("create");
          }}
          onClose={() => setSwitchOpen(false)}
        />
      )}
      {tabBar}
      {toast}
    </>
  );
}
