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
import { OpenApiV3, OpenApiV3_1, SwaggerV2 } from "@samchon/openapi";
import { useState } from "react";

import EditorUploader from "../../components/editor/EditorUploader";
import { EditorComposer } from "../../functional/EditorComposer";

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
    try {
      await EditorComposer[props.mode]({
        swagger,
        e2e,
        simulate,
      });
    } catch (exp) {
      setError(exp instanceof Error ? exp.message : "unknown error");
    }
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
