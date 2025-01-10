import { Primitive } from "typia";

import { INestiaAgentOperation } from "../structures/INestiaAgentOperation";
import { INestiaAgentPrompt } from "../structures/INestiaAgentPrompt";
import { NestiaAgentPromptFactory } from "./NestiaAgentPromptFactory";

export namespace NestiaAgentPromptTransformer {
  export const transform = (props: {
    operations: Map<string, Map<string, INestiaAgentOperation>>;
    input: Primitive<INestiaAgentPrompt>;
  }): INestiaAgentPrompt => {
    // TEXT
    if (props.input.type === "text") return props.input;
    // SELECT & CANCEL
    else if (props.input.type === "select" || props.input.type === "cancel")
      return {
        ...props.input,
        operations: props.input.operations.map((func) =>
          NestiaAgentPromptFactory.selection({
            ...findOperation({
              operations: props.operations,
              input: func,
            }),
            reason: func.reason,
          }),
        ),
      } satisfies INestiaAgentPrompt.ISelect | INestiaAgentPrompt.ICancel;
    // EXECUTE
    else if (props.input.type === "execute")
      return transformExecute({
        operations: props.operations,
        input: props.input,
      }) satisfies INestiaAgentPrompt.IExecute;
    // DESCRIBE
    return {
      type: "describe",
      text: props.input.text,
      executions: props.input.executions.map((next) =>
        transformExecute({
          operations: props.operations,
          input: next,
        }),
      ),
    } satisfies INestiaAgentPrompt.IDescribe;
  };

  const transformExecute = (props: {
    operations: Map<string, Map<string, INestiaAgentOperation>>;
    input: Primitive<INestiaAgentPrompt.IExecute>;
  }): INestiaAgentPrompt.IExecute => {
    const operation = findOperation({
      operations: props.operations,
      input: props.input,
    });
    return NestiaAgentPromptFactory.execute({
      type: "execute",
      protocol: operation.protocol as "http",
      controller: operation.controller,
      function: operation.function,
      id: props.input.id,
      arguments: props.input.arguments,
      value: props.input.value,
    });
  };

  const findOperation = (props: {
    operations: Map<string, Map<string, INestiaAgentOperation>>;
    input: {
      controller: string;
      function: string;
    };
  }): INestiaAgentOperation.IHttp => {
    const found: INestiaAgentOperation | undefined = props.operations
      .get(props.input.controller)
      ?.get(props.input.function);
    if (found === undefined)
      throw new Error(
        `No operation found: (controller: ${props.input.controller}, function: ${props.input.function})`,
      );
    return found as INestiaAgentOperation.IHttp;
  };
}
