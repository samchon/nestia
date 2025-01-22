import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { INestiaAgentProvider, NestiaAgent } from "@nestia/agent";
import { IHttpLlmApplication } from "@samchon/openapi";
import OpenAI from "openai";
import React, { useState } from "react";
import JsonInput from "react-json-editor-ajrm";
// @ts-ignore
import locale from "react-json-editor-ajrm/locale/en.js";

import { NestiaChatApplication } from "./NestiaChatApplication";
import { NestiaChatFileUploadMovie } from "./movies/uploader/NestiaChatFileUploadMovie";

export const NestiaChatUploader = (props: NestiaChatUploader.IProps) => {
  // PARAMETERS
  const [host, setHost] = useState("http://localhost:37001");
  const [headers, setHeaders] = useState<Record<string, string>>({
    Authorization: "YOUR_SERVER_API_KEY",
  });
  const [model, setModel] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("YOUR-OPENAI-API-KEY");

  // RESULT
  const [application, setApplication] =
    useState<IHttpLlmApplication<"chatgpt"> | null>(null);
  const [progress, setProgress] = useState(false);

  // HANDLERS
  const handleApplication = (
    application: IHttpLlmApplication<"chatgpt"> | null,
    error: string | null,
  ) => {
    setApplication(application);
    if (error !== null) handleError(error);
  };
  const handleError = (error: string) => {
    if (props.onError) props.onError(error);
    else alert(error);
  };

  const open = async () => {
    if (application === null) return;
    setProgress(true);
    try {
      const provider: INestiaAgentProvider = {
        type: "chatgpt",
        api: new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true,
        }),
        model: model as "gpt-4o",
      };
      const agent: NestiaAgent = new NestiaAgent({
        provider,
        controllers: [
          {
            protocol: "http",
            name: "main",
            application,
            connection: {
              host,
              headers,
            },
          },
        ],
      });
      props.onSuccess(<NestiaChatApplication agent={agent} />);
    } catch (error) {
      handleError(error instanceof Error ? error.message : "unknown error");
      setProgress(false);
    }
  };

  return (
    <React.Fragment>
      <NestiaChatFileUploadMovie onChange={handleApplication} />
      <br />
      <FormControl fullWidth style={{ paddingLeft: 15 }}>
        <Typography variant="h6">HTTP Connection</Typography>
        <br />
        <TextField
          onChange={(e) => setHost(e.target.value)}
          defaultValue={host}
          label="Host URL"
          variant="outlined"
        />
        <br />
        <FormLabel> Headers </FormLabel>
        <JsonInput
          locale={locale}
          theme="dark_vscode_tribute"
          placeholder={headers}
          onChange={setHeaders}
          height="100px"
        />
        <br />
        <br />
        <Typography variant="h6">LLM Arguments</Typography>
        <br />
        <FormLabel> LLM Provider </FormLabel>
        <RadioGroup defaultValue={"chatgpt"} style={{ paddingLeft: 15 }}>
          <FormControlLabel
            value="chatgpt"
            control={<Radio />}
            label="OpenAI (ChatGPT)"
          />
        </RadioGroup>
        <FormLabel style={{ paddingTop: 20 }}> OpenAI Model </FormLabel>
        <RadioGroup
          defaultValue={model}
          onChange={(_e, value) => setModel(value)}
          style={{ paddingLeft: 15 }}
        >
          <FormControlLabel value="gpt-4o" control={<Radio />} label="GPT-4o" />
          <FormControlLabel
            value="gpt-4o-mini"
            control={<Radio />}
            label="GPT-4o Mini"
          />
        </RadioGroup>
        <br />
        <TextField
          onChange={(e) => setApiKey(e.target.value)}
          defaultValue={apiKey}
          label="OpenAI API Key"
          variant="outlined"
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
        onClick={() => open()}
      >
        {progress ? "Generating..." : "Generate Editor"}
      </Button>
    </React.Fragment>
  );
};
export namespace NestiaChatUploader {
  export interface IProps {
    onError?: (error: string) => void;
    onSuccess: (element: JSX.Element) => void;
  }
}
