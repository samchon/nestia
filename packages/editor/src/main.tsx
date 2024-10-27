import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { NestiaEditorApplication } from "./NestiaEditorApplication.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NestiaEditorApplication />
  </StrictMode>,
);
