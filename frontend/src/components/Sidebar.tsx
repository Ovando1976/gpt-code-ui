import AssistantIcon from '@mui/icons-material/Assistant';
import SettingsIcon from '@mui/icons-material/Settings';
import GitHubIcon from '@mui/icons-material/GitHub';

import "./Sidebar.css";

interface SidebarProps {
  models: Array<{ name: string; displayName: string }>;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  openAIKey: string;
  setOpenAIKey: (key: string) => void;
}

export default function Sidebar(props: SidebarProps) {
  const handleOpenAIButtonClick = () => {
    const key = prompt("Enter your OpenAI key:", props.openAIKey);
    if (key !== null) props.setOpenAIKey(key);
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <AssistantIcon className="logo-icon" /> <span className="logo-text">NeoCoder</span>
        <div className="version">
          <GitHubIcon /> <a href="https://github.com/ricklamers/gpt-code-ui" target="_blank">Open Source v{import.meta.env.VITE_APP_VERSION}</a>
        </div>
      </div>

      <div className="settings">
        <div className="settings-header">
          <SettingsIcon /> Settings
        </div>

        <label>Model</label>
        <select
          value={props.selectedModel}
          onChange={(e) => props.onSelectModel(e.target.value)}
        >
          {props.models.map((model, idx) => (
            <option key={idx} value={model.name}>{model.displayName}</option>
          ))}
        </select>

        <label>Credentials</label>
        <button className="btn-primary" onClick={handleOpenAIButtonClick}>
          Set OpenAI Key
        </button>
      </div>
    </div>
  );
}