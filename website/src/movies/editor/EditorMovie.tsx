import { Paper } from "@mui/material";
import dynamic from "next/dynamic";

const NestiaEditorUploader = dynamic(
  () =>
    import("@nestia/editor").then((mod) => mod.NestiaEditorUploader),
  { ssr: false },
);

const EditorMovie = () => {
  return (
    <Paper style={{ padding: 10, marginTop: 20 }} elevation={5}>
      <NestiaEditorUploader />
    </Paper>
  );
};
export default EditorMovie;
