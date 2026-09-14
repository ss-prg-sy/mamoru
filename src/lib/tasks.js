import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// タスクの変更を監視する（リアルタイム同期）
// 戻り値の関数を呼ぶと監視をやめる
export function subscribeTasks(boardId, callback) {
  const q = query(
    collection(db, "boards", boardId, "tasks"),
    orderBy("orderIndex")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// タスクを追加する
export async function addTask(boardId, memberId, input, nextOrderIndex) {
  await addDoc(collection(db, "boards", boardId, "tasks"), {
    title: input.title,
    description: input.description || "",
    dueDate: input.dueDate || null,
    priority: input.priority || "medium",
    assigneeIds: input.assigneeIds || [],
    status: "open",
    orderIndex: nextOrderIndex,
    createdBy: memberId,
    completedBy: null,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// タスクの内容を書き換える
export async function updateTask(boardId, taskId, patch) {
  await updateDoc(doc(db, "boards", boardId, "tasks", taskId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

// タスクを消す
export async function deleteTask(boardId, taskId) {
  await deleteDoc(doc(db, "boards", boardId, "tasks", taskId));
}

// 完了と未完了を切り替える
export async function toggleComplete(boardId, task, memberId) {
  if (task.status === "done") {
    await updateTask(boardId, task.id, {
      status: "open",
      completedBy: null,
      completedAt: null,
    });
  } else {
    await updateTask(boardId, task.id, {
      status: "done",
      completedBy: memberId,
      completedAt: serverTimestamp(),
    });
  }
}

// このタスクを完了にできる人かどうか
export function canComplete(task, memberId) {
  const assignees = task.assigneeIds || [];
  if (assignees.length === 0) return true; // みんな向けは誰でも
  return assignees.includes(memberId) || task.createdBy === memberId;
}

// 一覧の末尾に入れるための並び順の値
export function nextOrderIndex(tasks) {
  if (!tasks.length) return 1000;
  return Math.max(...tasks.map((t) => t.orderIndex || 0)) + 1000;
}

// 期限が過ぎているか
export function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return task.dueDate < `${y}-${m}-${d}`;
}

// 2026-09-20 を 9/20（土）の形にする
export function formatDate(value) {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${m}/${d}（${week}）`;
}