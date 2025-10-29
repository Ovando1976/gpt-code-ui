import React from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthButton() {
  const { user, signInWithGoogle, logout } = useAuth();

  if (!user) {
    return <button onClick={signInWithGoogle}>Sign in with Google</button>;
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <img src={user.photoURL || ""} alt={user.displayName || "avatar"} style={{width:28,height:28,borderRadius:14}} />
      <span>{user.displayName || user.email}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}