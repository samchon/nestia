import {
  INestiaAgentOperationSelection,
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
      <NestiaChatTokenUsageSideMovie usage={props.usage} />
      <br />
      <br />
      <NestiaChatFunctionStackSideMovie selections={props.selections} />
    </div>
  );
};
export namespace NestiaChatSideMovie {
  export interface IProps {
    usage: INestiaAgentTokenUsage;
    selections: INestiaAgentOperationSelection[];
  }
}
