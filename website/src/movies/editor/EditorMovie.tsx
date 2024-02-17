import {
  Button,
  FormControl,
  FormControlLabel,
  Paper,
  Switch,
} from "@mui/material";
import { ISwagger, MigrateApplication } from "@nestia/migrate";
import { IMigrateFile } from "@nestia/migrate/lib/structures/IMigrateFile";
import sdk from "@stackblitz/sdk";
import prettierEsTreePlugin from "prettier/plugins/estree";
import prettierTsPlugin from "prettier/plugins/typescript";
import { format } from "prettier/standalone";
import { useState } from "react";

import EditorUploader from "../../components/editor/EditorUploader";

const createFiles = async (
  swagger: ISwagger,
  config: MigrateApplication.IConfig,
): Promise<null | IMigrateFile[]> => {
  try {
    const app: MigrateApplication = new MigrateApplication(swagger);
    const { files }: MigrateApplication.IOutput = app.sdk(config);
    for (const f of files)
      if (f.file.substring(f.file.length - 3) === ".ts")
        f.content = await format(f.content, {
          parser: "typescript",
          plugins: [prettierEsTreePlugin, prettierTsPlugin],
        });
    return files;
  } catch {
    return null;
  }
};

const EditorMovie = () => {
  const [swagger, setSwagger] = useState<ISwagger | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(true);
  const [e2e, setE2e] = useState(true);
  const [progress, setProgress] = useState(false);

  const handleSwagger = (swagger: ISwagger | null, error: string | null) => {
    setSwagger(swagger);
    setError(error);
  };

  const generate = async () => {
    if (swagger === null) return;

    setProgress(true);
    const files: null | IMigrateFile[] = await createFiles(swagger, {
      simulate,
      e2e,
    });
    if (files === null) {
      setProgress(false);
      return alert("Invalid swagger file (must follow OpenAPI 3.0 spec).");
    }

    sdk.openProject(
      {
        title: "TypeScript Swagger Editor",
        template: "node",
        files: Object.fromEntries(
          files.map(
            (f) =>
              [
                [f.location, f.location.length ? "/" : "", f.file].join(""),
                f.content,
              ] as const,
          ),
        ),
      },
      {
        newWindow: true,
        openFile: "README.md,test/start.ts",
        startScript: simulate ? "test:simulate" : "test",
      },
    );
    setProgress(false);
  };

  return (
    <Paper style={{ padding: 10, marginTop: 20 }} elevation={5}>
      <EditorUploader onChange={handleSwagger} />
      <br />
      <FormControl fullWidth style={{ paddingLeft: 15 }}>
        <FormControlLabel
          label="Mockup Simulator"
          control={
            <Switch
              checked={simulate}
              onChange={() => setSimulate(!simulate)}
            />
          }
        />
        <FormControlLabel
          label="E2E Test Functions"
          control={<Switch checked={e2e} onChange={() => setE2e(!e2e)} />}
        />
      </FormControl>
      <br />
      <br />
      <Button
        component="a"
        fullWidth
        variant="contained"
        color={"info"}
        size="large"
        disabled={progress === true || swagger === null}
        onClick={() => generate()}
      >
        {error ?? (progress ? "Generating..." : "Generate Editor")}
      </Button>
    </Paper>
  );
};
export default EditorMovie;
