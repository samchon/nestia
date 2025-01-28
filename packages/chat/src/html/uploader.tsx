import { createRoot } from "react-dom/client";

import { NestiaChatUploader } from "../applications/NestiaChatUploader";

createRoot(window.document.getElementById("root")!).render(
  <NestiaChatUploader
    style={{
      width: "calc(100% - 30px)",
      height: "calc(100% - 30px)",
      overflowY: "auto",
      padding: 15,
    }}
    onSuccess={(element) => {
      createRoot(window.document.getElementById("root")!).render(element);
    }}
  />,
);
