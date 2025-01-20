import OpenAI from "openai";

import { NestiaAgentSource } from "../typings/NestiaAgentSource";
import { INestiaAgentConfig } from "./INestiaAgentConfig";
import { INestiaAgentEvent } from "./INestiaAgentEvent";
import { INestiaAgentOperationCollection } from "./INestiaAgentOperationCollection";
import { INestiaAgentOperationSelection } from "./INestiaAgentOperationSelection";
import { INestiaAgentPrompt } from "./INestiaAgentPrompt";

export interface INestiaAgentContext {
  // APPLICATION
  operations: INestiaAgentOperationCollection;
  config: INestiaAgentConfig | undefined;

  // STATES
  histories: INestiaAgentPrompt[];
  stack: INestiaAgentOperationSelection[];
  prompt: INestiaAgentPrompt.IText;
  ready: () => boolean;

  // HANDLERS
  dispatch: (event: INestiaAgentEvent) => Promise<void>;
  request: (
    source: NestiaAgentSource,
    body: Omit<OpenAI.ChatCompletionCreateParamsNonStreaming, "model">,
  ) => Promise<OpenAI.ChatCompletion>;
  initialize: () => Promise<void>;
}
