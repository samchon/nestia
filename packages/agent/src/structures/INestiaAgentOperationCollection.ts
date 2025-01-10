import { INestiaAgentOperation } from "./INestiaAgentOperation";

export interface INestiaAgentOperationCollection {
  array: INestiaAgentOperation[];
  divided?: INestiaAgentOperation[][] | undefined;
  flat: Map<string, INestiaAgentOperation>;
  group: Map<string, Map<string, INestiaAgentOperation>>;
}
