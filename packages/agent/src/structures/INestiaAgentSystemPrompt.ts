import { INestiaAgentConfig } from "./INestiaAgentConfig";
import { INestiaAgentPrompt } from "./INestiaAgentPrompt";

export interface INestiaAgentSystemPrompt {
  common?: (config?: INestiaAgentConfig | undefined) => string;
  initialize?: (histories: INestiaAgentPrompt[]) => string;
  select?: (histories: INestiaAgentPrompt[]) => string;
  cancel?: (histories: INestiaAgentPrompt[]) => string;
  execute?: (histories: INestiaAgentPrompt[]) => string;
  describe?: (histories: INestiaAgentPrompt.IExecute[]) => string;
}
