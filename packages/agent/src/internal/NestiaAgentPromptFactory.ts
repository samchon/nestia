import { INestiaAgentOperationSelection } from "../structures/INestiaAgentOperationSelection";
import { INestiaAgentPrompt } from "../structures/INestiaAgentPrompt";

export namespace NestiaAgentPromptFactory {
  export const execute = (
    props: Omit<INestiaAgentPrompt.IExecute, "toJSON">,
  ): INestiaAgentPrompt.IExecute =>
    ({
      ...props,
      toJSON: () =>
        ({
          ...props,
          controller: props.controller.name,
          function: props.function.name,
        }) as any,
    }) as INestiaAgentPrompt.IExecute;

  export const selection = (
    props: Omit<INestiaAgentOperationSelection, "toJSON">,
  ): INestiaAgentOperationSelection =>
    ({
      ...props,
      toJSON: () =>
        ({
          ...props,
          controller: props.controller.name,
          function: props.function.name,
        }) as any,
    }) as INestiaAgentOperationSelection;
}
