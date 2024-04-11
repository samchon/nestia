import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Switch,
} from "@mui/material";
import { MigrateApplication } from "@nestia/migrate";
import { IMigrateFile } from "@nestia/migrate/lib/structures/IMigrateFile";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import sdk from "@stackblitz/sdk";
import prettierEsTreePlugin from "prettier/plugins/estree";
import prettierTsPlugin from "prettier/plugins/typescript";
import { format } from "prettier/standalone";
import { useState } from "react";
import { IValidation } from "typia";

import EditorUploader from "../../components/editor/EditorUploader";

const EditorMovie = (props: { mode: "nest" | "sdk" }) => {
  // PARAMETERS
  const [mode, setMode] = useState<"nest" | "sdk">(props.mode);
  const [simulate, setSimulate] = useState(true);
  const [e2e, setE2e] = useState(true);

  // RESULT
  const [swagger, setSwagger] = useState<
    SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(false);

  const createFiles = async (
    swagger: SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument,
    config: MigrateApplication.IConfig,
  ): Promise<null | IMigrateFile[]> => {
    try {
      const result: IValidation<MigrateApplication> =
        await MigrateApplication.create(swagger as any);
      if (result.success === false) {
        alert(
          "Invalid swagger file (based on OpenAPI 3.0 spec).\n\n" +
            JSON.stringify(result.errors, null, 2),
        );
        return null;
      }

      const app: MigrateApplication = result.data;
      const { files }: MigrateApplication.IOutput = app[mode](config);
      for (const f of files)
        if (f.file.substring(f.file.length - 3) === ".ts")
          f.content = await format(f.content, {
            parser: "typescript",
            plugins: [prettierEsTreePlugin, prettierTsPlugin],
          });
      return files;
    } catch (exp) {
      alert(exp instanceof Error ? exp.message : "unkown error");
      return null;
    }
  };

  const handleSwagger = (
    swagger:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | null,
    error: string | null,
  ) => {
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
      return;
    }

    sdk.openProject(
      {
        title: swagger.info?.title ?? "TypeScript Swagger Editor",
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
        startScript: (mode === "sdk"
          ? ["swagger", "hello"]
          : ["build:test,test", ""]) as any,
      },
    );
    setProgress(false);
  };

  return (
    <Paper style={{ padding: 10, marginTop: 20 }} elevation={5}>
      <EditorUploader onChange={handleSwagger} />
      <br />
      <FormControl fullWidth style={{ paddingLeft: 15 }}>
        <FormLabel> Mode </FormLabel>
        <RadioGroup
          defaultValue={mode}
          onChange={(evt) => setMode(evt.target.value as "nest" | "sdk")}
          style={{ paddingLeft: 15 }}
        >
          <FormControlLabel
            value="sdk"
            control={<Radio />}
            label="Software Development Kit"
          />
          <FormControlLabel
            value="nest"
            control={<Radio />}
            label="NestJS Project"
          />
        </RadioGroup>
        <FormLabel style={{ paddingTop: 20 }}> Options </FormLabel>
        <FormControlLabel
          label="Mockup Simulator"
          style={{ paddingTop: 5, paddingLeft: 15 }}
          control={
            <Switch
              checked={simulate}
              onChange={() => setSimulate(!simulate)}
            />
          }
        />
        <FormControlLabel
          label="E2E Test Functions"
          style={{ paddingLeft: 15 }}
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
