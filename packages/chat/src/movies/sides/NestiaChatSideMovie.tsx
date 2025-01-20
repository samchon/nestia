import { Typography } from "@mui/material";
import {
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
      <Typography variant="h5">Agent Information</Typography>
      <hr />
      <ul>
        <li> Provider: {props.provider.type} </li>
        <li> Model: {props.provider.model} </li>
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
    usage: INestiaAgentTokenUsage;
    selections: INestiaAgentOperationSelection[];
  }
}
