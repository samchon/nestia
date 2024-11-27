import { TypedException } from "@nestia/core";
import { JsonMetadataFactory } from "typia/lib/factories/JsonMetadataFactory";

import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationException } from "../structures/IReflectHttpOperationException";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { IOperationMetadata } from "../transformers/IOperationMetadata";

export namespace ReflectHttpOperationExceptionAnalyzer {
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    errors: IReflectOperationError[];
  }
  export const analyze = (
    ctx: IContext,
  ): Record<string, IReflectHttpOperationException> => {
    const preconfigured: TypedException.IProps<any>[] = analyzePreconfigured(
      ctx.function,
    )
      .slice()
      .reverse();
    const errors: IReflectOperationError[] = [];
    const exceptions: IReflectHttpOperationException[] = preconfigured
      .map((pre, i) => {
        const matched: IOperationMetadata.IException | null =
          ctx.metadata.exceptions[i];
        if (matched === undefined) {
          errors.push({
            file: ctx.controller.file,
            class: ctx.controller.class.name,
            function: ctx.functionName,
            from: `exception (status: ${pre.status})`,
            contents: ["Unable to find exception type."],
          });
          return null;
        } else if (matched.type === null) {
          errors.push({
            file: ctx.controller.file,
            class: ctx.controller.class.name,
            function: ctx.functionName,
            from: `exception (status: ${pre.status})`,
            contents: ["Failed to get the type info."],
          });
        }
        const schema: IOperationMetadata.ISchema | null = matched.primitive
          .success
          ? matched.primitive.data
          : null;
        if (schema === null || matched.type === null) return null; // unreachable
        return {
          status: pre.status,
          description: pre.description ?? null,
          example: pre.example,
          examples: pre.examples,
          type: matched.type,
          ...schema,
          validate: JsonMetadataFactory.validate,
        } satisfies IReflectHttpOperationException;
      })
      .filter((e) => e !== null);
    if (errors.length) ctx.errors.push(...errors);
    return Object.fromEntries(exceptions.map((e) => [e.status, e]));
  };

  const analyzePreconfigured = (func: Function): TypedException.IProps<any>[] =>
    Reflect.getMetadata("nestia/TypedException", func) ?? [];
}
