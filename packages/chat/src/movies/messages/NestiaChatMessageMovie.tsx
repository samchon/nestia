import { INestiaAgentPrompt } from "@nestia/agent";

import { NestiaChatDescribeMessageMovie } from "./NestiaChatDescribeMessageMovie";
import { NestiaChatTextMessageMovie } from "./NestiaChatTextMessageMovie";

export const NestiaChatMessageMovie = ({
  prompt,
}: NestiaChatMessageMovie.IProps) => {
  if (prompt.type === "text")
    return <NestiaChatTextMessageMovie prompt={prompt} />;
  else if (prompt.type === "describe")
    return <NestiaChatDescribeMessageMovie prompt={prompt} />;
  return null;
};
export namespace NestiaChatMessageMovie {
  export interface IProps {
    prompt: INestiaAgentPrompt;
  }
}
