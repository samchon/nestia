import {
  MetadataCollection,
  MetadataFactory,
  MetadataSchema,
  TransformerError,
} from "@typia/core";
import { ValidationPipe } from "@typia/interface";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { check_mcp_object } from "./internal/check_mcp_object";

/**
 * Compile-time validator for the return type of an `@McpRoute()` method.
 *
 * Mirrors {@link TypedRouteProgrammer} but adapted to MCP's structured-output
 * rules. The MCP specification requires every tool's output to be a single
 * object value or nothing at all. To enforce that:
 *
 * - `void` returns short-circuit (nothing emitted).
 * - Object returns are inspected directly on the analyzed metadata to reject
 *   primitives, unions, and dynamic-key records.
 * - Mixed unions of `void` and a value type are rejected outright; MCP has no
 *   way to model "sometimes returns nothing, sometimes returns X".
 *
 * @author wildduck - https://github.com/wildduck2
 */
export namespace McpRouteReturnProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): void => {
    const inner: ts.Type =
      props.context.checker.getAwaitedType(props.type) ?? props.type;
    if (inner.isUnion()) {
      const hasVoid = inner.types.some((t) => isVoidLike(t));
      const hasValue = inner.types.some((t) => !isVoidLike(t));
      if (hasVoid && hasValue)
        throw new Error(
          "[@nestia.core.McpRoute] tool return type must be either `void` or a single object type. Mixed unions of `void` and an object type are not supported.",
        );
    }
    if (isVoidLike(inner)) return;

    const result: ValidationPipe<MetadataSchema, MetadataFactory.IError> =
      MetadataFactory.analyze({
        checker: props.context.checker,
        transformer: props.context.transformer,
        options: {
          escape: true,
          constant: true,
          absorb: true,
        },
        components: new MetadataCollection(),
        type: inner,
      });
    if (result.success === false)
      throw TransformerError.from({
        code: "@nestia.core.McpRoute.Return",
        errors: result.errors,
      });

    if (result.data.size() === 0) return;
    const violations: string[] = check_mcp_object("return")(result.data);
    if (violations.length)
      throw new Error(
        `[@nestia.core.McpRoute.Return] ${violations.join(" ")}`,
      );
  };

  const isVoidLike = (t: ts.Type): boolean =>
    Boolean(
      t.flags &
        (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never),
    );
}
