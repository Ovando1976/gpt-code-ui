import { useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export function usePresence() {
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, "presence", uid);

    // On online: set presence doc
    setDoc(ref, { uid, displayName: auth.currentUser?.displayName || null, last_seen: serverTimestamp(), online: true }, { merge: true });

    // On unload: mark offline
    const handleBeforeUnload = async () => {
      await setDoc(ref, { online: false, last_seen: serverTimestamp() }, { merge: true });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setDoc(ref, { online: false, last_seen: serverTimestamp() }, { merge: true });
    };
  }, []);
}