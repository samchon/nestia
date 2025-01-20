import { Primitive } from "typia";

import { INestiaAgentConfig } from "./INestiaAgentConfig";
import { INestiaAgentController } from "./INestiaAgentController";
import { INestiaAgentPrompt } from "./INestiaAgentPrompt";
import { INestiaAgentProvider } from "./INestiaAgentProvider";

export interface INestiaAgentProps {
  controllers: INestiaAgentController[];
  provider: INestiaAgentProvider;
  config?: INestiaAgentConfig;
  histories?: Primitive<INestiaAgentPrompt>[];
}
