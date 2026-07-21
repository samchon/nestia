import { TypedException } from "@nestia/core";

import { JsonMetadataFactory } from "../internal/legacy";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationException } from "../structures/IReflectHttpOperationException";
import { IReflectOperationError } from "../structures/IReflectOperationError";

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
    // TypeScript applies decorators bottom-up, so Reflect's metadata array
    // is the reverse of declaration order. Reverse it once here so the
    // resulting status-code → exception map iterates in declaration order
    // and lines up with the Go transformer's metadata.exceptions[], which
    // is emitted in AST/declaration order (see
    // packages/core/native/cmd/ttsc-nestia/sdk_transform.go).
    const preconfigured: TypedException.IProps<any>[] = analyzePreconfigured(
      ctx.function,
    )
      .slice()
      .reverse();
    const errors: IReflectOperationError[] = [];
    const exceptions: IReflectHttpOperationException[] = preconfigured
      .map((pre, i) => {
        const matched: IOperationMetadata.IResponse | undefined =
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
        if (matched.primitive.success === false) {
          errors.push({
            file: ctx.controller.file,
            class: ctx.controller.class.name,
            function: ctx.functionName,
            from: `exception (status: ${pre.status})`,
            contents: matched.primitive.errors.map((e) => ({
              name: e.name,
              accessor: e.accessor,
              messages: e.messages,
            })),
          });
        }
        if (schema === null || matched.type === null) return null;
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
