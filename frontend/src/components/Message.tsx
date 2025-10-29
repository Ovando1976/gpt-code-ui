import { useState, useEffect } from "react";
import VoiceChatIcon from "@mui/icons-material/VoiceChat";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReplayIcon from "@mui/icons-material/Replay";
import PushPinIcon from "@mui/icons-material/PushPin";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MessageDict } from "../App";
import "./Chat.css";

interface MessageProps {
  text: string;
  role: string;
  type: string;
  showLoader?: boolean;
  onRetry?: (text: string) => void;
  onPin?: (msg: MessageDict) => void;
  msg?: MessageDict; // pass the full message object
}

// Export WaitingStates so Chat.tsx can import
export enum WaitingStates {
  GeneratingCode = "Generating code",
  RunningCode = "Running code",
  UploadingFile = "Uploading file",
  Idle = "Idle",
}

export default function Message({ text, role, type, showLoader, onRetry, onPin, msg }: MessageProps) {
  const [pinned, setPinned] = useState(msg?.pinned ?? false);
  const [animating, setAnimating] = useState(false);

  // Copy message text
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Retry handler
  const handleRetry = () => {
    if (onRetry) onRetry(text);
  };

  // Toggle pin/unpin with animation
  const togglePin = () => {
    setPinned((prev) => !prev);
    if (onPin && msg) onPin(msg);

    // Trigger pop animation
    setAnimating(true);
  };

  // Remove animation class after animation ends
  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(false), 300); // match CSS
      return () => clearTimeout(timer);
    }
  }, [animating]);

  return (
    <div
      className={`message ${role === "system" ? "system" : "user"} ${pinned ? "pinned" : ""} ${animating ? "pin-anim" : ""}`}
    >
      <div className="avatar-holder">
        <div className="avatar">{role === "system" ? <VoiceChatIcon /> : <PersonIcon />}</div>
      </div>

      <div className="message-body">
        {type === "code" && (
          <div className="code-block">
            <strong>Generated code:</strong>
            <SyntaxHighlighter language="python" style={oneDark} wrapLongLines>
              {text}
            </SyntaxHighlighter>
          </div>
        )}

        {(type === "message" || type === "message_raw") && (
          <div>
            {text} {showLoader && <span className="loader"></span>}
          </div>
        )}

        {type.startsWith("image/") && (
          <div
            className="cell-output-image"
            dangerouslySetInnerHTML={{
              __html: `<img src='data:${type};base64,${text}' />`,
            }}
          />
        )}

        {/* Message action buttons */}
        <div className="message-actions">
          <button onClick={handleCopy} title="Copy message">
            <ContentCopyIcon fontSize="small" />
          </button>

          {role === "system" && type !== "code" && onRetry && (
            <button onClick={handleRetry} title="Retry">
              <ReplayIcon fontSize="small" />
            </button>
          )}

          <button onClick={togglePin} title={pinned ? "Unpin" : "Pin"}>
            <PushPinIcon fontSize="small" color={pinned ? "primary" : "inherit"} />
          </button>
        </div>
      </div>
    </div>
  );
}