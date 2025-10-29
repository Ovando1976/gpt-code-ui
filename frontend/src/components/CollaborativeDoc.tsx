// src/components/CollaborativeDoc.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";

export default function CollaborativeDoc({ docId }: { docId: string }) {
  const [value, setValue] = useState("");
  const saveRef = useRef<number | null>(null);

  useEffect(() => {
    const ref = doc(db, "docs", docId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.content && d.content !== value) setValue(d.content);
      } else {
        // create placeholder
        setDoc(ref, { content: "", createdAt: serverTimestamp(), collaborators: [] }, { merge: true });
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const onChange = (content: string) => {
    setValue(content);
    if (saveRef.current) window.clearTimeout(saveRef.current);
    saveRef.current = window.setTimeout(async () => {
      await setDoc(doc(db, "docs", docId), { content, lastUpdatedBy: auth.currentUser?.uid || null, lastUpdatedAt: serverTimestamp() }, { merge: true });
    }, 600);
  };

  return <ReactQuill value={value} onChange={onChange} />;
}