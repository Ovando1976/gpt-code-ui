// src/components/Chat.tsx
import { useEffect, useState, RefObject } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { MessageDict } from "../App";
import { WaitingStates } from "../types";
import Message from "./Message";
import "./Chat.css";

interface ChatProps {
  chatId: string;
  chatScrollRef: RefObject<HTMLDivElement>;
  waitingForSystem: WaitingStates;
  onRetryMessage?: (text: string) => void;
}

export default function Chat({ chatId, chatScrollRef, onRetryMessage }: ChatProps) {
  const [messages, setMessages] = useState<MessageDict[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ uid: string; displayName?: string }[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<MessageDict[]>([]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const msgs: MessageDict[] = snapshot.docs.map(
        (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...(d.data() as MessageDict) })
      );
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // typing listener
  useEffect(() => {
    if (!chatId) return;
    const typingRef = collection(db, "chats", chatId, "typing");
    const q = query(typingRef);

    const unsub = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      setTypingUsers(arr);
    });

    return () => unsub();
  }, [chatId]);

  const handleRetry = (text: string) => {
    if (onRetryMessage) onRetryMessage(text);
  };

  const handlePin = async (msg: MessageDict) => {
    // toggle pin locally (optimistic)
    setPinnedMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev.filter((m) => m.id !== msg.id);
      return [...prev, msg];
    });

    const docRef = doc(db, "chats", chatId, "messages", msg.id);
    await updateDoc(docRef, { pinned: !msg.pinned });
  };

  const pinned = messages.filter((m) => m.pinned);
  const unpinned = messages.filter((m) => !m.pinned);
  // prefer Firestore truth for pinned; keep local pinnedMessages for immediate UX, but show pinned derived from messages
  const displayedMessages = [...pinned, ...unpinned];

  // autoscroll while keeping pinned messages visible
  useEffect(() => {
    if (!chatScrollRef.current) return;
    const container = chatScrollRef.current;

    // Sum heights of pinned elements
    const pinnedElems = container.querySelectorAll(".message.pinned");
    let pinnedHeight = 0;
    pinnedElems.forEach((el) => (pinnedHeight += (el as HTMLElement).offsetHeight + 6));

    container.scrollTo({
      top: container.scrollHeight - container.clientHeight + pinnedHeight,
      behavior: "smooth",
    });
  }, [displayedMessages, chatScrollRef]);

  return (
    <>
      <div className="chat-messages" ref={chatScrollRef}>
        {displayedMessages.map((msg) => (
          <Message
            key={msg.id}
            text={msg.text}
            role={msg.role}
            type={msg.type}
            msg={msg}
            onRetry={msg.role === "system" ? handleRetry : undefined}
            onPin={handlePin}
          />
        ))}

        {typingUsers.length > 0 && (
          <div className="typing-banner">
            {typingUsers.map((t) => t.displayName || t.uid).join(", ")} typing...
          </div>
        )}

        {/* Show loader if waiting */}
        { /* Optionally show the waiting loader as a system message */ }
      </div>
    </>
  );
}