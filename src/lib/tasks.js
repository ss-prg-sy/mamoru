import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export const MAX_TASKS = 100;

// タスクの変更を監視する（リアルタイム同期）
export function subscribeTasks(boardId, callback) {
  const q = query(
    collection(db, "boards", boardId, "tasks"),
    orderBy("orderIndex")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// 100件に達していたら、いちばん古い完了タスクを消して空ける
// 完了タスクが1件もなければエラーにする
export async function ensureCapacity(boardId, tasks) {
  if (tasks.length < MAX_TASKS) return;

  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => {
      const av = a.completedAt?.seconds || 0;
      const bv = b.completedAt?.seconds || 0;
      return av - bv;
    });

  if (done.length === 0) {
    throw new Error(
      `タスクが上限の${MAX_TASKS}件です。いくつか完了か削除をしてください`
    );
  }

  await deleteTask(boardId, done[0].id);
}

// タスクを追加する
export async function addTask(boardId, memberId, input, nextIndex) {
  await addDoc(collection(db, "boards", boardId, "tasks"), {
    title: input.title,
    description: input.description || "",
    dueDate: input.dueDate || null,
    priority: input.priority || "medium",
    assigneeIds: input.assigneeIds || [],
    status: "open",
    orderIndex: nextIndex,
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

// 消したタスクを元に戻す（同じIDで書き戻す）
export async function restoreTask(boardId, task) {
  const { id, ...rest } = task;
  await setDoc(doc(db, "boards", boardId, "tasks", id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

// 並び順をまとめて書き換える
export async function reorderTasks(boardId, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((taskId, i) => {
    batch.update(doc(db, "boards", boardId, "tasks", taskId), {
      orderIndex: (i + 1) * 1000,
    });
  });
  await batch.commit();
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

// 編集と削除ができるのは作成者だけ
export function canEdit(task, memberId) {
  return task.createdBy === memberId;
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

// Firestore の日時を 2026/9/5 14:23 の形にする
export function formatDateTime(value) {
  if (!value || !value.toDate) return "";
  const d = value.toDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

// 絞り込みの初期値
export const DEFAULT_FILTER = { status: "open", assignee: "all" };

// 絞り込みを当てはめる
export function applyFilter(tasks, filter, memberId) {
  let list = tasks.filter((t) => {
    if (filter.status === "open" && t.status !== "open") return false;
    if (filter.status === "done" && t.status !== "done") return false;
    return true;
  });

  if (filter.assignee === "mine") {
    list = list.filter((t) => (t.assigneeIds || []).includes(memberId));
  } else if (filter.assignee !== "all") {
    list = list.filter((t) => (t.assigneeIds || []).includes(filter.assignee));
  }

  if (filter.status === "done") {
    list = [...list].sort((a, b) => {
      const av = a.completedAt?.seconds || 0;
      const bv = b.completedAt?.seconds || 0;
      return bv - av;
    });
  }
  return list;
}

// 絞り込みがかかっているか
export function isFiltered(filter) {
  return (
    filter.status !== DEFAULT_FILTER.status ||
    filter.assignee !== DEFAULT_FILTER.assignee
  );
}