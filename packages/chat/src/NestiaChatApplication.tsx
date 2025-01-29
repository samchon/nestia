import { NestiaAgent } from "@nestia/agent";

import { NestiaChatMovie } from "./movies/NestiaChatMovie";

export const NestiaChatApplication = ({
  agent,
}: NestiaChatApplication.IProps) => {
  return <NestiaChatMovie agent={agent} />;
};
export namespace NestiaChatApplication {
  export interface IProps {
    agent: NestiaAgent;
  }
}
