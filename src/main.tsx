/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
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

// Initialize intellectual property protection
initializeIPProtection();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
