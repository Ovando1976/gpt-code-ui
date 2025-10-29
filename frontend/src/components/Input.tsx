// frontend/src/components/Input.tsx
import { useRef, useState } from "react";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SendIcon from "@mui/icons-material/Send";
import TextareaAutosize from "react-textarea-autosize";
import Config from "../config";
import "./Input.css";

interface InputProps {
  onSendMessage: (msg: string) => void;
  onStartUpload: (filename: string) => void;
  onCompletedUpload: (filename: string) => void;
  isTyping?: boolean;
}

export default function Input(props: InputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [userInput, setUserInput] = useState("");

  const handleInputFocus = () => setInputIsFocused(true);
  const handleInputBlur = () => setInputIsFocused(false);

  const handleUploadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // safe to call click() on the element if it exists
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.currentTarget.files) return;

    const files = Array.from(e.currentTarget.files);

    for (const file of files) {
      props.onStartUpload(file.name);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${Config.WEB_ADDRESS}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        props.onCompletedUpload(file.name);
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    // Reset the file input's value (safe via currentTarget)
    e.currentTarget.value = "";
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    props.onSendMessage(userInput.trim());
    setUserInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`input-parent ${props.isTyping ? "typing-glow" : ""}`}>
      <div className={`input-holder ${inputIsFocused ? "focused" : ""}`}>
        <form className="file-upload" onSubmit={(e) => e.preventDefault()}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
            aria-hidden="true"
          />
          <button type="button" onClick={handleUploadClick} title="Upload file">
            <FileUploadIcon />
          </button>
        </form>

        <TextareaAutosize
          className="textarea"
          rows={1}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or command..."
        />

        {props.isTyping && (
          <div className="typing-indicator" aria-hidden>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <button className="send" onClick={handleSendMessage} title="Send message" aria-label="Send">
          <SendIcon />
        </button>
      </div>
    </div>
  );
}