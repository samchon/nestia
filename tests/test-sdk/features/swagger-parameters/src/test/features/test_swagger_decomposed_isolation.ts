import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { Controller, INestApplication, Module, Query } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { OpenApi } from "typia";

import { HandWrittenMetadata } from "../internal/HandWrittenMetadata";
import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

@Controller("isolation")
class IsolationController {
  @core.TypedRoute.Get()
  public get(@Query() query: object): void {
    query;
  }
}

@Module({ controllers: [IsolationController] })
class IsolationModule {}

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
 * @evidence contracts/testing.md#behavioral-verification After editing first document minimum to999, a second public composition must still yield exact number/minimum1.
 * @evidence contracts/testing.md#independent-expectations HandWrittenMetadata explicitly bakes number/minimum1, and999 is an independent deliberate mutation; the later expected schema is handwritten, not copied from the first output.
 * @evidence contracts/testing.md#distinguishing-cases First versus second composition contrasts caller mutation with original baked input; this case isolates one decomposed property ownership path.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_decomposed_isolation export is discovered and awaited by the swagger-parameters feature entry after actual emitted execution. Assertion failure rejects its report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary The public NestiaSwaggerComposer must consume explicitly registered metadata and actual Nest/decorator/configuration state. This probes its runtime composition boundary, not the native extraction of the handwritten metadata; generated siblings retain native-connection coverage.
 * @evidence contracts/e2e.md#shared-execution Packed dependencies and emitted runtime are shared with the feature. One local real Nest application is necessary for this distinct metadata-registration/composition probe and reused by every repeated composition in the case; no compiler is launched per compose.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Metadata is defined on this case’s distinct private controller prototype and the case owns a local application closed in finally. Config/snapshots/documents are local; deliberate caller/customizer mutation is consumed serially and never handed to a sibling.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_decomposed_isolation documented assertions remain in this executable owner. Deprecated/key-set/finite controls add positive presence checks to retained comparisons, while fallback and isolation still exercise public runtime composition rather than replacing it with a fabricated pass.
 */
export const test_swagger_decomposed_isolation = async (): Promise<void> => {
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    HandWrittenMetadata.operation({ baked: true, members: [] }),
    IsolationController.prototype,
    "get",
  );

  const app: INestApplication = await NestFactory.create(IsolationModule, {
    logger: false,
  });
  try {
    const compose = async (): Promise<SwaggerParameterReader.IParameter> =>
      SwaggerParameterReader.parameters(
        (await NestiaSwaggerComposer.document(app, {})) as OpenApi.IDocument,
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
  } finally {
    await app.close();
  }
};
