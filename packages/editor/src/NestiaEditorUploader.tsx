import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  TextField,
} from "@mui/material";
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@typia/interface";
import React from "react";

import { NestiaEditorArchiver } from "./internal/NestiaEditorArchiver";
import { NestiaEditorComposer } from "./internal/NestiaEditorComposer";
import { NESTIA_EDITOR_DEFAULT_PACKAGE } from "./internal/NestiaEditorDefaultPackage";
import { NestiaEditorFileUploader } from "./internal/NestiaEditorFileUploader";

/**
 * The uploader form: reads a Swagger file, and downloads the generated project.
 *
 * The user picks a document, a package name, the mode (SDK or NestJS project), and the options. The project is generated in the browser and downloaded as a zip file. Operations the converter could not handle are reported, so an incomplete project is never presented as complete.
 *
 * @evidence contracts/common.md#principled-implementation The form keeps its inputs in component state, composes on request with `NestiaEditorComposer`, and hands the files to `NestiaEditorArchiver`; every failure and every skipped operation reaches the error handler.
 * @evidence contracts/common.md#clear-and-simple-design One component owns the form state and delegates parsing the file, composing, and archiving to internal modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The defaults are the same product defaults as the iframe flow and the package name comes from the shared constant; an error goes to `onError` when given and to `alert` otherwise, with no fixture-specific path.
 * @evidence contracts/common.md#meaningful-documentation The comment states the inputs, the output, and how skipped operations are reported.
 */
export function NestiaEditorUploader(props: NestiaEditorUploader.IProps) {
  // PARAMETERS
  const [mode, setMode] = React.useState<"nest" | "sdk">("sdk");
  const [keyword, setKeyword] = React.useState(true);
  const [simulate, setSimulate] = React.useState(true);
  const [e2e, setE2e] = React.useState(true);
  const [name, setName] = React.useState(NESTIA_EDITOR_DEFAULT_PACKAGE);

  // RESULT
  const [document, setDocument] = React.useState<
    SwaggerV2.IDocument | OpenApiV3.IDocument | OpenApiV3_1.IDocument | null
  >(null);
  const [progress, setProgress] = React.useState(false);

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
        keyword,
        e2e,
        simulate,
        package: name,
      });
      if (result.success === true) {
        NestiaEditorArchiver.download({
          name: NestiaEditorArchiver.name(name),
          files: result.data.files,
        });
        if (result.data.skipped.length !== 0)
          handleError(
            [
              "The project leaves out operations that could not be converted:",
              ...result.data.skipped.map(
                (s) => `  - ${s.method} ${s.path}: ${s.messages.join(" ")}`,
              ),
            ].join("\n"),
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
        <TextField
          onChange={(e) => setName(e.target.value)}
          defaultValue={name}
          label="Package Name"
          variant="outlined"
        />
        <FormLabel style={{ paddingTop: 20 }}> Mode </FormLabel>
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
          label="Keyword Parameter"
          style={{ paddingTop: 5, paddingLeft: 15 }}
          control={
            <Switch checked={keyword} onChange={() => setKeyword(!keyword)} />
          }
        />
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
        {progress ? "Generating..." : "Download Project"}
      </Button>
    </>
  );
}
/**
 * Properties of {@link NestiaEditorUploader}.
 *
 * @evidence contracts/common.md#principled-implementation The namespace holds the property type of the component with the same name, so the component and its inputs are one public identity.
 * @evidence contracts/common.md#clear-and-simple-design It contains one interface with one optional callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds no behavior; when the callback is absent the component reports errors with `alert`.
 * @evidence contracts/common.md#meaningful-documentation The comment names the component the properties belong to.
 */
export namespace NestiaEditorUploader {
  export interface IProps {
    onError?: (error: string) => void;
  }
}
