import { TestValidator } from "@nestia/e2e";
import { Controller, Query } from "@nestjs/common";
import { OpenApi } from "typia";

import core from "../../../../packages/core/lib";
import { HandWrittenMetadata } from "../internal/HandWrittenMetadata";
import { SwaggerMetadataComposer } from "../internal/SwaggerMetadataComposer";
import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

@Controller("isolation")
class IsolationController {
  @core.TypedRoute.Get("", { type: "stringify", stringify: JSON.stringify })
  public get(@Query() query: object): void {
    query;
  }
}

/**
 * Verifies each composed document owns its decomposed parameter schemas.
 *
 * The baked property schemas live in the route metadata, which outlives any one
 * document. Handing them out by reference would let an edit to one document, a
 * `SwaggerCustomizer` closure for instance, leak into every later composition,
 * where the fallback it replaced built fresh schemas each time.
 *
 * 1. Register baked metadata for one decomposed query route.
 * 2. Compose a document directly and edit its parameter schema.
 * 3. Compose again and assert the new document still has the baked schema.
 *
 * @evidence contracts/testing.md#behavioral-verification Editing the first decomposed schema to minimum 999 cannot alter the next document's authored minimum one.
 * @evidence contracts/testing.md#independent-expectations Original hand-authored operation metadata and literal expected edits, property names and schemas are independent inputs and expectations. No compiler-produced output supplies either.
 * @evidence contracts/testing.md#distinguishing-cases Editing the first decomposed schema to minimum 999 cannot alter the next document's authored minimum one.
 * @evidence contracts/testing.md#execution-ownership Canonical SDK direct units discover this matching export with plugins off. Actual built reflection, typed-route and Swagger operations consume authored metadata directly, without compilation, installation, application creation or child processes.
 */
export const test_sdk_swagger_decomposed_isolation =
  async (): Promise<void> => {
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      HandWrittenMetadata.operation({ baked: true, members: [] }),
      IsolationController.prototype,
      "get",
    );

    const compose = async (): Promise<SwaggerParameterReader.IParameter> =>
      SwaggerParameterReader.parameters(
        (await SwaggerMetadataComposer(
          IsolationController,
          ["get"],
          {},
        )) as OpenApi.IDocument,
        "/isolation",
        "get",
      )[0]!;
    const first: SwaggerParameterReader.IParameter = await compose();
    (first.schema as OpenApi.IJsonSchema.INumber).minimum = 999;

    const second: SwaggerParameterReader.IParameter = await compose();
    TestValidator.equals(
      "schema",
      SwaggerParameterReader.canonical(second.schema),
      SwaggerParameterReader.canonical({ type: "number", minimum: 1 }),
    );
  };
