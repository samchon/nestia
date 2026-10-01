import { TypedException } from "@nestia/core";

import { JsonMetadataFactory } from "../internal/legacy";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationException } from "../structures/IReflectHttpOperationException";
import { IReflectOperationError } from "../structures/IReflectOperationError";

/**
 * Reflects the `@TypedException` declarations of a method.
 *
 * @evidence contracts/common.md#principled-implementation The declarations are read in declaration order and matched by position with the exception types the transform recorded.
 * @evidence contracts/common.md#clear-and-simple-design One public function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The matching is by position because both lists are produced in declaration order.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace ReflectHttpOperationExceptionAnalyzer {
  /**
   * The input of the exception analysis: the controller, the method, its name,
   * the HTTP method, the metadata, and the error list.
   *
   * @evidence contracts/common.md#principled-implementation The record holds what the analysis needs.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes and the meaning of its members.
   */
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    errors: IReflectOperationError[];
  }
  /**
   * Returns the exceptions of a method by status.
   *
   * A declaration without a matching type, or with an unreadable one, is an
   * error.
   *
   * @evidence contracts/common.md#principled-implementation Decorators apply bottom-up, so the metadata array is reversed to declaration order before it is paired with the transform's exception list, and the result is keyed by status, so the last declaration of a status wins.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The pairing follows the documented order, and every mismatch is reported.
   * @evidence contracts/common.md#meaningful-documentation The comment states the matching and the errors.
   */
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
