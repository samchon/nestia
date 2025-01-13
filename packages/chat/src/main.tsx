import { createRoot } from "react-dom/client";

import { NestiaChatUploader } from "./NestiaChatUploader";

createRoot(window.document.getElementById("root")!).render(
  <NestiaChatUploader
    onSuccess={(element) => {
      createRoot(window.document.getElementById("root")!).render(element);
    }}
  />,
);
