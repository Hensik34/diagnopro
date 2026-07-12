
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Check if browser supports flexbox gap natively, and apply fallback class if it doesn't.
(function detectFlexGap() {
  if (typeof document !== "undefined") {
    const runCheck = () => {
      if (!document.body) return;
      const flex = document.createElement("div");
      flex.style.display = "flex";
      flex.style.flexDirection = "column";
      flex.style.rowGap = "1px";
      flex.appendChild(document.createElement("div"));
      flex.appendChild(document.createElement("div"));
      flex.children[0].setAttribute("style", "height: 1px");
      flex.children[1].setAttribute("style", "height: 1px");
      document.body.appendChild(flex);
      const isSupported = flex.scrollHeight === 3;
      document.body.removeChild(flex);
      if (!isSupported) {
        document.documentElement.classList.add("no-flex-gap");
      }
    };
    if (document.body) {
      runCheck();
    } else {
      document.addEventListener("DOMContentLoaded", runCheck);
    }
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
  