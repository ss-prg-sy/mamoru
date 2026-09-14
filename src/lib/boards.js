import { db } from "../firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, serverTimestamp
} from "firebase/firestore";

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

  // すでに使われている合言葉なら止める
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
// メンバー一覧を取る
export async function getMembers(boardId) {
  const snap = await getDocs(collection(db, "boards", boardId, "members"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// タスク欄に参加する
export async function joinBoard(boardId, displayName) {
  const memberRef = doc(collection(db, "boards", boardId, "members"));
  await setDoc(memberRef, {
    displayName,
    joinedAt: serverTimestamp(),
    isActive: true,
  });
  return memberRef.id;
}