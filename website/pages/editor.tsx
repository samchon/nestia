import { NestiaEditorApplication } from "@nestia/editor/lib/NestiaEditorApplication";

export default function Editor() {
  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        margin: 0,
        overflow: "hidden",
      }}
    >
      <NestiaEditorApplication />
    </div>
  );
}
