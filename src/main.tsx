/**
 * @license
 * Copyright (c) 2024-2026 Alec Arthur Shelton. All Rights Reserved.
 * Proprietary and Confidential - Natural Vision™ Technology
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "./lib/errorReporting";
import { initializeIPProtection } from "./lib/security/ipProtection";

// Setup global error handlers for automated bug collection
setupGlobalErrorHandlers();

// Stale-build recovery: if a lazy-loaded chunk 404s because this tab is
// holding an older index.html after a deploy, reload once to fetch the
// current build instead of landing on the ErrorBoundary.
const RELOAD_FLAG = "ep-chunk-reload";
const isChunkError = (msg: unknown) =>
  typeof msg === "string" &&
  /loading chunk|dynamically imported module|preload/i.test(msg);

window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  location.reload();
});

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason);
  if (isChunkError(msg) && !sessionStorage.getItem(RELOAD_FLAG)) {
    sessionStorage.setItem(RELOAD_FLAG, "1");
    location.reload();
  }
});

// Clear the flag once the app has booted so future deploys can reload again.
setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 10000);

// Initialize intellectual property protection
initializeIPProtection();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
