import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
} from "@mui/material";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import StackBlitzSDK from "@stackblitz/sdk";
import { useState } from "react";

import { NestiaEditorComposer } from "./internal/NestiaEditorComposer";
import { NestiaEditorFileUploader } from "./internal/NestiaEditorFileUploader";

export function NestiaEditorUploader(props: NestiaEditorUploader.IProps) {
  // PARAMETERS
  const [mode, setMode] = useState<"nest" | "sdk">("sdk");
  const [simulate, setSimulate] = useState(true);
  const [e2e, setE2e] = useState(true);

  // RESULT
  const [document, setDocument] = useState<
    SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument | null
  >(null);
  const [progress, setProgress] = useState(false);

  const handleError = (error: string) => {
    if (props.onError) props.onError(error);
    else alert(error);
  };
  const handleSwagger = (
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | null,
    error: string | null,
  ) => {
    setDocument(document);
    if (error !== null) handleError(error);
  };

  const generate = async () => {
    if (document === null) return;

    setProgress(true);
    try {
      const result = await NestiaEditorComposer[mode]({
        document,
        e2e,
        simulate,
      });
      if (result.success === true) {
        StackBlitzSDK.openProject(
          {
            title: document.info?.title ?? "Nestia Editor",
            template: "node",
            files: result.data.files,
          },
          {
            newWindow: true,
            openFile: result.data.openFile,
            startScript: result.data.startScript as any,
          },
        );
      } else {
        handleError(JSON.stringify(result.errors, null, 2));
      }
    } catch (exp) {
      handleError(exp instanceof Error ? exp.message : "unknown error");
    }
    setProgress(false);
  };

  return (
    <>
      <NestiaEditorFileUploader onChange={handleSwagger} />
      <br />
      <FormControl fullWidth style={{ paddingLeft: 15 }}>
        <FormLabel> Mode </FormLabel>
        <RadioGroup
          defaultValue={mode}
          onChange={(_e, value) => setMode(value as "nest" | "sdk")}
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
        disabled={progress === true || document === null}
        onClick={() => generate()}
      >
        {progress ? "Generating..." : "Generate Editor"}
      </Button>
    </>
  );
}
export namespace NestiaEditorUploader {
  export interface IProps {
    onError?: (error: string) => void;
  }
}
