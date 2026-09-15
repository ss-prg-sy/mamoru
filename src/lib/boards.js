import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

export const MAX_MEMBERS = 10;

// 合言葉を保存用の文字列に変換する
export async function hashPassphrase(passphrase) {
  const data = new TextEncoder().encode(passphrase);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 合言葉からタスク欄を探す
export async function findBoardByPassphrase(passphrase) {
  const hash = await hashPassphrase(passphrase);
  const snap = await getDoc(doc(db, "passphrases", hash));
  if (!snap.exists()) return null;
  return snap.data().boardId;
}

// タスク欄を新しく作る
export async function createBoard(name, passphrase, displayName) {
  const hash = await hashPassphrase(passphrase);

  const exists = await getDoc(doc(db, "passphrases", hash));
  if (exists.exists()) {
    throw new Error("この合言葉は使われています");
  }

  const boardRef = doc(collection(db, "boards"));
  const memberRef = doc(collection(db, "boards", boardRef.id, "members"));

  await setDoc(boardRef, {
    name,
    passphrase,
    ownerMemberId: memberRef.id,
    createdAt: serverTimestamp(),
  });

  await setDoc(memberRef, {
    displayName,
    joinedAt: serverTimestamp(),
    isActive: true,
  });

  await setDoc(doc(db, "passphrases", hash), { boardId: boardRef.id });

  return { boardId: boardRef.id, memberId: memberRef.id };
}

// タスク欄の情報を取る
export async function getBoard(boardId) {
  const snap = await getDoc(doc(db, "boards", boardId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// メンバー一覧を取る（在籍中のみ）
export async function getMembers(boardId) {
  const snap = await getDocs(collection(db, "boards", boardId, "members"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => m.isActive !== false);
}

// タスク欄に参加する
export async function joinBoard(boardId, displayName) {
  const members = await getMembers(boardId);
  if (members.length >= MAX_MEMBERS) {
    throw new Error(
      `このタスク欄は上限の${MAX_MEMBERS}人に達しています`
    );
  }

  const memberRef = doc(collection(db, "boards", boardId, "members"));
  await setDoc(memberRef, {
    displayName,
    joinedAt: serverTimestamp(),
    isActive: true,
  });
  return memberRef.id;
}

// 切り替えシート用に、参加中のタスク欄の情報をまとめて取る
export async function getJoinedBoardsInfo(joined) {
  const results = [];
  for (const j of joined) {
    const board = await getBoard(j.boardId);
    if (!board) continue; // 消えたタスク欄は飛ばす
    const members = await getMembers(j.boardId);
    results.push({
      boardId: j.boardId,
      memberId: j.memberId,
      name: board.name,
      memberCount: members.length,
    });
  }
  return results;
}

// 表示名を変える
export async function updateMemberName(boardId, memberId, displayName) {
  await updateDoc(doc(db, "boards", boardId, "members", memberId), {
    displayName,
  });
}

// メンバーを外す（タスクは残し、担当者からだけ外す）
export async function removeMember(boardId, memberId) {
  const batch = writeBatch(db);

  batch.update(doc(db, "boards", boardId, "members", memberId), {
    isActive: false,
  });

  const tasksSnap = await getDocs(collection(db, "boards", boardId, "tasks"));
  tasksSnap.docs.forEach((d) => {
    const ids = d.data().assigneeIds || [];
    if (ids.includes(memberId)) {
      batch.update(d.ref, {
        assigneeIds: ids.filter((x) => x !== memberId),
      });
    }
  });

  await batch.commit();
}

// 管理者を引き継ぐ
export async function transferOwner(boardId, newOwnerMemberId) {
  await updateDoc(doc(db, "boards", boardId), {
    ownerMemberId: newOwnerMemberId,
  });
}

// タスク欄の名前を変える
export async function updateBoardName(boardId, name) {
  await updateDoc(doc(db, "boards", boardId), { name });
}

// 合言葉を変える
export async function changePassphrase(boardId, oldPassphrase, newPassphrase) {
  const newHash = await hashPassphrase(newPassphrase);

  const exists = await getDoc(doc(db, "passphrases", newHash));
  if (exists.exists()) {
    throw new Error("この合言葉は使われています");
  }

  await setDoc(doc(db, "passphrases", newHash), { boardId });
  await updateDoc(doc(db, "boards", boardId), { passphrase: newPassphrase });

  if (oldPassphrase) {
    const oldHash = await hashPassphrase(oldPassphrase);
    if (oldHash !== newHash) {
      await deleteDoc(doc(db, "passphrases", oldHash));
    }
  }
}

// タスク欄ごと消す
export async function deleteBoard(boardId, passphrase) {
  const tasksSnap = await getDocs(collection(db, "boards", boardId, "tasks"));
  const membersSnap = await getDocs(
    collection(db, "boards", boardId, "members")
  );

  const batch = writeBatch(db);
  tasksSnap.docs.forEach((d) => batch.delete(d.ref));
  membersSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  if (passphrase) {
    const hash = await hashPassphrase(passphrase);
    await deleteDoc(doc(db, "passphrases", hash));
  }
  await deleteDoc(doc(db, "boards", boardId));
}