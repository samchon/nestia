import { Typography } from "@mui/material";
import {
  INestiaAgentConfig,
  INestiaAgentOperationSelection,
  INestiaAgentProvider,
  INestiaAgentTokenUsage,
} from "@nestia/agent";

import { NestiaChatFunctionStackSideMovie } from "./NestiaChatFunctionStackSideMovie";
import { NestiaChatTokenUsageSideMovie } from "./NestiaChatTokenUsageSideMovie";

export const NestiaChatSideMovie = (props: NestiaChatSideMovie.IProps) => {
  return (
    <div
      style={{
        padding: 25,
      }}
    >
      {props.error !== null ? (
        <>
          <Typography variant="h5" color="error">
            OpenAI Error
          </Typography>
          <hr />
          {props.error.message}
          <br />
          <br />
          Your OpenAI API key may not valid.
          <br />
          <br />
          <br />
        </>
      ) : null}
      <Typography variant="h5">Agent Information</Typography>
      <hr />
      <ul>
        <li> Provider: {props.provider.type} </li>
        <li> Model: {props.provider.model} </li>
        <li> Locale: {props.config?.locale ?? navigator.language} </li>
        <li>
          Timezone:{" "}
          {props.config?.timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone}
        </li>
      </ul>
      <br />
      <br />
      <NestiaChatTokenUsageSideMovie usage={props.usage} />
      <br />
      <br />
      <NestiaChatFunctionStackSideMovie selections={props.selections} />
    </div>
  );
};
export namespace NestiaChatSideMovie {
  export interface IProps {
    provider: INestiaAgentProvider;
    config: INestiaAgentConfig | undefined;
    usage: INestiaAgentTokenUsage;
    selections: INestiaAgentOperationSelection[];
    error: Error | null;
  }
}
