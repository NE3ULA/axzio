import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AxzioProvider } from "./store.jsx";
import { CloudProvider } from "./cloud.jsx";
import { ErrorBoundary } from "./components/ui.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AxzioProvider>
      <CloudProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </CloudProvider>
    </AxzioProvider>
  </React.StrictMode>
);
