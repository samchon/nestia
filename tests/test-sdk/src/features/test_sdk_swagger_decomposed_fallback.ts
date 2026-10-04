import { TestValidator } from "@nestia/e2e";
import { Controller, Query } from "@nestjs/common";
import { OpenApi } from "typia";

import core from "../../../../packages/core/lib";
import { HandWrittenMetadata } from "../internal/HandWrittenMetadata";
import { SwaggerMetadataComposer } from "../internal/SwaggerMetadataComposer";
import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

@Controller("fallback")
class FallbackController {
  @core.TypedRoute.Get("baked", {
    type: "stringify",
    stringify: JSON.stringify,
  })
  public baked(@Query() query: object): void {
    query;
  }

  @core.TypedRoute.Get("unbaked", {
    type: "stringify",
    stringify: JSON.stringify,
  })
  public unbaked(@Query() query: object): void {
    query;
  }
}

/**
 * Verifies a decomposed parameter takes the baked property schema, and that
 * only metadata without one falls back, still honoring typia's omissions.
 *
 * The SDK transform bakes `jsonSchema.properties` for every parameter object,
 * so the JS fallback that reads only the atomic kind is left for metadata the
 * transform did not bake. On that path no bake filters for typia, so the
 * composer itself skips what typia's object schema omits: `@hidden` and
 * `@ignore` members, and `@internal` ones, which typia's metadata normally
 * drops before the composer sees them. The metadata is registered by hand,
 * because these tests are compiled without the SDK transform, and because the
 * formatter would rewrite a `@hidden` tag in a source file.
 *
 * 1. Register one query object's metadata on two routes: one baked with a property
 *    schema that differs from the fallback's, one without the bake.
 * 2. Compose the document through the owning reflected-route and Swagger
 *    operations.
 * 3. Assert the baked route uses the baked schema, and the unbaked route falls
 *    back to the atomic schema, both omitting the `@internal`, `@hidden`, and
 *    `@ignore` members.
 *
 * @evidence contracts/testing.md#behavioral-verification Baked minimum one and unbaked plain number retain exact visible-only parameter names while internal, hidden and ignored metadata members remain omitted.
 * @evidence contracts/testing.md#independent-expectations Original hand-authored operation metadata and literal expected edits, property names and schemas are independent inputs and expectations. No compiler-produced output supplies either.
 * @evidence contracts/testing.md#distinguishing-cases Baked minimum one and unbaked plain number retain exact visible-only parameter names while internal, hidden and ignored metadata members remain omitted.
 * @evidence contracts/testing.md#execution-ownership Canonical SDK direct units discover this matching export with plugins off. Actual built reflection, typed-route and Swagger operations consume authored metadata directly, without compilation, installation, application creation or child processes.
 */
export const test_sdk_swagger_decomposed_fallback = async (): Promise<void> => {
  for (const [method, baked] of [
    ["baked", true],
    ["unbaked", false],
  ] as const)
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      HandWrittenMetadata.operation({
        baked,
        members: ["internal", "hidden", "ignored"],
      }),
      FallbackController.prototype,
      method,
    );

  const document = (await SwaggerMetadataComposer(
    FallbackController,
    ["baked", "unbaked"],
    {},
  )) as OpenApi.IDocument;
  for (const [path, schema] of [
    ["/fallback/baked", { type: "number", minimum: 1 }],
    ["/fallback/unbaked", { type: "number" }],
  ] as const) {
    const parameters: SwaggerParameterReader.IParameter[] =
      SwaggerParameterReader.parameters(document, path, "get");
    TestValidator.equals(
      `${path} names`,
      parameters.map((p) => p.name),
      ["visible"],
    );
    TestValidator.equals(
      `${path} schema`,
      SwaggerParameterReader.canonical(parameters[0]?.schema),
      SwaggerParameterReader.canonical(schema),
    );
  }
};
