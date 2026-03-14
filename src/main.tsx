import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "tauri-plugin-gamepad-api";
import "@/css/index.css";

// Utils
import RPC from "@/services/RPC";

// Pages
import App from "@/pages/App";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

RPC.StartRPC();

const Root = () => {
  const navEntry = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0];
  if (navEntry?.type === "reload") window.location.href = "/";

  return (
    <>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </>
  );
};

document.addEventListener("contextmenu", (e) => e.preventDefault());

root.render(
  <HashRouter>
    <Root />
  </HashRouter>
);