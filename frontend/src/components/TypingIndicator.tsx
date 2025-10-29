// frontend/src/components/TypingIndicator.tsx
import React from "react";
import { getAuth } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * startTypingHeartbeat
 * - Starts a simple heartbeat which marks `chats/{chatId}/typing/{uid}` document with a timestamp.
 * - Returns a stop function to cancel the heartbeat and optionally clear the typing flag.
 *
 * Usage:
 * const stop = startTypingHeartbeat(chatId);
 * // later
 * stop();
 */
export function startTypingHeartbeat(chatId: string, intervalMs = 3000) {
  if (!chatId) {
    console.warn("startTypingHeartbeat: chatId required");
    return () => {};
  }

  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    // no user signed in — we still return a no-op stop function
    console.warn("startTypingHeartbeat: no authenticated user");
    return () => {};
  }

  let stopped = false;
  const typingDocRef = doc(db, "chats", chatId, "typing", uid);

  async function beat() {
    try {
      await setDoc(typingDocRef, { uid, ts: serverTimestamp() }, { merge: true });
    } catch (err) {
      // swallowing: non-fatal
      console.debug("typing heartbeat write failed:", err);
    }
  }

  // initial beat
  void beat();

  const timer = setInterval(() => {
    if (stopped) return;
    void beat();
  }, intervalMs);

  return async function stop(clearFlag = true) {
    stopped = true;
    clearInterval(timer);
    if (clearFlag) {
      try {
        // best-effort: remove the typing doc
        await setDoc(typingDocRef, { uid, ts: null }, { merge: true });
      } catch (e) {
        // ignore
      }
    }
  };
}

/** Small presentational typing indicator component */
export default function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={className ?? "typing-indicator"} aria-hidden>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}