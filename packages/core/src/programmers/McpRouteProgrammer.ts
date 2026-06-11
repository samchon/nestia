import {
  LlmParametersProgrammer,
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
 * Compile-time JSON Schema emitter for `@McpRoute.Params<T>()` types.
 *
 * Mirrors {@link TypedBodyProgrammer} for runtime validators, but instead of
 * emitting a `typia.assert` closure it emits a literal JSON Schema object.
 * The MCP specification requires `inputSchema` to be a single static object
 * type — no primitives, no unions, no dynamic-key records — so this
 * programmer rejects anything else with a {@link TransformerError}.
 *
 * The emitted shape is `LlmParametersProgrammer`'s parameters block —
 * `{ type: "object", properties, required, $defs }` — which is exactly what
 * the MCP `tools/list` response requires for `inputSchema`. Plain
 * `JsonSchemaProgrammer.write` cannot be used here because it may produce a
 * top-level `$ref` to a `$defs` entry, which MCP clients reject.
 *
 * @author wildduck - https://github.com/wildduck2
 */
export namespace McpRouteProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.Expression => {
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
        type: props.type,
      });
    if (result.success === false)
      throw TransformerError.from({
        code: "@nestia.core.McpRoute.Params",
        errors: result.errors,
      });

    const violations: string[] = check_mcp_object("params")(result.data);
    if (violations.length)
      throw new Error(
        `[@nestia.core.McpRoute.Params] ${violations.join(" ")}`,
      );

    return LlmParametersProgrammer.write({
      context: {
        ...props.context,
        options: {
          numeric: false,
          finite: false,
          functional: false,
        },
      },
      config: { strict: false },
      metadata: result.data,
    });
  };

}
