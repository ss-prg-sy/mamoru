const KEY = "mamoru:boards";
const LAST_KEY = "mamoru:lastBoardId";

// 参加中のタスク欄を全部取る
export function getJoinedBoards() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 参加したタスク欄を覚える
export function saveJoinedBoard(boardId, memberId) {
  const list = getJoinedBoards().filter((b) => b.boardId !== boardId);
  list.push({ boardId, memberId });
  localStorage.setItem(KEY, JSON.stringify(list));
  localStorage.setItem(LAST_KEY, boardId);
}

// 特定のタスク欄での自分のメンバーIDを取る
export function getMemberId(boardId) {
  const found = getJoinedBoards().find((b) => b.boardId === boardId);
  return found ? found.memberId : null;
}

// 最後に開いていたタスク欄
export function getLastBoardId() {
  return localStorage.getItem(LAST_KEY);
}

export function setLastBoardId(boardId) {
  localStorage.setItem(LAST_KEY, boardId);
}

// タスク欄から抜ける
export function removeJoinedBoard(boardId) {
  const list = getJoinedBoards().filter((b) => b.boardId !== boardId);
  localStorage.setItem(KEY, JSON.stringify(list));
  if (getLastBoardId() === boardId) {
    localStorage.removeItem(LAST_KEY);
  }
}