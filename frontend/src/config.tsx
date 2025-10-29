const isDev = process.env.NODE_ENV === 'development';
const API_BASE = isDev ? "http://localhost:3001" : "https://your-production-api-url.com";

const Config = {
  WEB_ADDRESS: isDev ? "http://localhost:3000" : "https://your-production-web-url.com",
  API_ADDRESS: API_BASE,
  WS_ADDRESS: API_BASE.replace(/^http/, "ws"), // converts http -> ws and https -> wss
};
export default Config;