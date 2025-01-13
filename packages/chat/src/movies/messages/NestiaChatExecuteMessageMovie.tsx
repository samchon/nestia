import { Typography } from "@mui/material";
import { INestiaAgentPrompt } from "@nestia/agent";
import React from "react";

import { MarkdownViewer } from "../../components/MarkdownViewer";

export const NestiaChatExecuteMessageMovie = ({
  execute,
}: NestiaChatExecuteMessageMovie.IProps) => {
  return (
    <React.Fragment>
      <Typography variant="h5"> {getTitle(execute)} </Typography>
      <hr />
      <Typography variant="h6"> Description </Typography>
      <MarkdownViewer>{execute.function.description}</MarkdownViewer>
      <br />
      <Typography variant="h6"> Arguments </Typography>
      <MarkdownViewer>
        {["```json", JSON.stringify(execute.arguments, null, 2), "```"].join(
          "\n",
        )}
      </MarkdownViewer>
      <br />
      <Typography variant="h6"> Return Value </Typography>
      <MarkdownViewer>
        {["```json", JSON.stringify(execute.value, null, 2), "```"].join("\n")}
      </MarkdownViewer>
    </React.Fragment>
  );
};
export namespace NestiaChatExecuteMessageMovie {
  export interface IProps {
    execute: INestiaAgentPrompt.IExecute;
  }
}

const getTitle = (exec: INestiaAgentPrompt.IExecute) =>
  exec.protocol === "http"
    ? `${exec.function.method.toUpperCase()} ${exec.function.path}`
    : exec.function.name;
