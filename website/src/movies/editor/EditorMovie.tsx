import { Paper } from "@mui/material";
import { NestiaEditorUploader } from "@nestia/editor";

const EditorMovie = () => {
  return (
    <Paper style={{ padding: 10, marginTop: 20 }} elevation={5}>
      <NestiaEditorUploader />
    </Paper>
  );
};
export default EditorMovie;
