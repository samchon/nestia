import { TestValidator } from "@nestia/e2e";
import { Controller, Get, Query } from "@nestjs/common";
import { OpenApi } from "typia";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness as SwaggerParameterReader } from "./internal/SwaggerCompositionHarness";

@Controller("isolation")
class IsolationController {
  @Get()
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
 * 2. Compose a document at runtime and edit its parameter schema.
 * 3. Compose again and assert the new document still has the baked schema.
 *
 * @evidence contracts/testing.md#behavioral-verification After editing first document minimum to999, a second generator composition must still yield exact number/minimum1.
 * @evidence contracts/testing.md#independent-expectations HandWrittenMetadata explicitly bakes number/minimum1, and999 is an independent deliberate mutation; the later expected schema is handwritten, not copied from the first output.
 * @evidence contracts/testing.md#distinguishing-cases First versus second composition contrasts caller mutation with original baked input; this case isolates one decomposed property ownership path.
 * @evidence contracts/testing.md#execution-ownership The test-sdk unit entry discovers this export and directly calls reflection, typed-route and Swagger composition owners over authored metadata. No Nest application, installation, native artifact, CLI or HTTP host is prepared.
 */
export const test_sdk_swagger_decomposed_isolation =
  async (): Promise<void> => {
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      HandWrittenMetadata.operation({ baked: true, members: [] }),
      IsolationController.prototype,
      "get",
    );

    const routes = SwaggerParameterReader.routes(IsolationController);
    const compose = async (): Promise<SwaggerParameterReader.IParameter> =>
      SwaggerParameterReader.parameters(
        (await SwaggerParameterReader.compose(routes, {})) as OpenApi.IDocument,
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
