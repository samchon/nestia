import dynamic from "next/dynamic";

const NestiaEditorApplication = dynamic(
  () =>
    import("@nestia/editor").then((mod) => mod.NestiaEditorApplication),
  { ssr: false },
);

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
