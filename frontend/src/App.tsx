import "./App.css";
import { useAuth } from "./hooks/useAuth"; // or import hook
import { usePresence } from "./hooks/usePresence";
import AuthButton from "./components/AuthButton";
import Input from "./components/Input";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { WaitingStates } from "./types";
import { useState, useRef, useEffect } from "react";
import Config from "./config";
import { useLocalStorage } from "usehooks-ts";



export interface MessageDict {
  id: string;
  text: string;
  role: "user" | "system";
  type: "message" | "code" | string; // allow images like "image/png"
  pinned?: boolean; // track pin status
  timestamp: number;
}

function App() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) usePresence();
  }, [user]);

  // create or select chatId after auth...
  const chatId = "default-chat"; // create a doc /chats/default-chat manually or auto create

  const COMMANDS = ["reset", "clear"];
  const MODELS = [
    { displayName: "GPT-3.5", name: "gpt-3.5-turbo" },
    { displayName: "GPT-4", name: "gpt-4" },
  ];


  const handleRetryMessage = (text: string) => {
  if (!text.trim()) return;

  // Add user-like message indicating retry
  addMessage({ 
    id: crypto.randomUUID(), 
    text: `Retrying: ${text}`, 
    role: "system", 
    type: "message",
    timestamp: Date.now() 
  });

  setWaitingForSystem(WaitingStates.GeneratingCode);

  wsRef.current?.send(
    JSON.stringify({
      action: "run_code",
      code: text,
      model: selectedModel,
      openAIKey,
    })
  );
};

  const [selectedModel, setSelectedModel] = useLocalStorage<string>("model", MODELS[0].name);
  const [openAIKey, setOpenAIKey] = useLocalStorage<string>("OpenAIKey", "");
  const [messages, setMessages] = useState<MessageDict[]>([
    { id: crypto.randomUUID(), text: "Hello! Ask me to do something.", role: "system", type: "message", timestamp: Date.now() },
    { id: crypto.randomUUID(), text: "Type 'reset' to restart the kernel.", role: "system", type: "message", timestamp: Date.now() },
  ]);
  const [waitingForSystem, setWaitingForSystem] = useState<WaitingStates>(WaitingStates.Idle);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  /** Initialize WebSocket */
  useEffect(() => {
    wsRef.current = new WebSocket(`${Config.WS_ADDRESS}/ws`);

    wsRef.current.onopen = () => console.log("WebSocket connected");

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Streaming code output
      if (data.type === "stream") {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === "system" && lastMsg.type === "code") {
            const updated = [...prev];
            updated[updated.length - 1].text += data.output;
            return updated;
          } else {
            return [...prev, { 
              id: crypto.randomUUID(), 
              text: data.output, 
              type: "code", 
              role: "system", 
              timestamp: Date.now() 
            }];
          }
        });
      }

      // Finalize message
      if (data.type === "final") setWaitingForSystem(WaitingStates.Idle);
    };

    wsRef.current.onclose = () => console.log("WebSocket disconnected");
    wsRef.current.onerror = (err) => console.error("WebSocket error:", err);

    return () => wsRef.current?.close();
  }, []);

  /** Add a message to state */
  const addMessage = (msg: MessageDict) => setMessages((prev) => [...prev, msg]);

  /** Handle special commands */
  const handleCommand = (command: string) => {
    if (command === "reset") {
      addMessage({ id: crypto.randomUUID(), text: "Restarting kernel...", role: "system", type: "message", timestamp: Date.now() });
      wsRef.current?.send(JSON.stringify({ action: "reset" }));
    }
    if (command === "clear") setMessages([]);
  };

  /** Send a user message / run code */
  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    if (COMMANDS.includes(text)) return handleCommand(text);

    addMessage({ id: crypto.randomUUID(), text, role: "user", type: "message", timestamp: Date.now() });
    setWaitingForSystem(WaitingStates.GeneratingCode);

    wsRef.current?.send(
      JSON.stringify({
        action: "run_code",
        code: text,
        model: selectedModel,
        openAIKey,
      })
    );
  };

  /** File upload completion */
  const completeUpload = (filename: string) => {
    addMessage({ id: crypto.randomUUID(), text: `File ${filename} uploaded successfully.`, role: "system", type: "message", timestamp: Date.now() });
  };


  /** Auto-scroll chat but keep pinned messages visible */
useEffect(() => {
  if (!chatScrollRef.current) return;

  const container = chatScrollRef.current;

  // Calculate the total height of pinned messages
  const pinnedElems = container.querySelectorAll(".message.pinned");
  let pinnedHeight = 0;
  pinnedElems.forEach((el) => {
    pinnedHeight += (el as HTMLElement).offsetHeight + 6; // 6px gap
  });

  // Scroll to bottom minus pinned height
  container.scrollTo({
    top: container.scrollHeight - container.clientHeight + pinnedHeight,
    behavior: "smooth",
  });
}, [messages]);

  
  return (
    <div className="app">
      <Sidebar
        models={MODELS}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        openAIKey={openAIKey}
        setOpenAIKey={setOpenAIKey}
      />
      <div className="main">
        <Chat
  chatScrollRef={chatScrollRef}
  waitingForSystem={waitingForSystem}
  messages={messages}
  onRetryMessage={handleRetryMessage}
/>
<Input
          onSendMessage={sendMessage}
          onStartUpload={() => setWaitingForSystem(WaitingStates.UploadingFile)}
          onCompletedUpload={completeUpload}
          isTyping={waitingForSystem === WaitingStates.GeneratingCode}
        />
      </div>
    </div>
  );
}

export default App;