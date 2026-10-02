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
 * @evidence contracts/testing.md#behavioral-verification Mutates a first composed decomposed schema and requires a second composition to retain the authored minimum.
 * @evidence contracts/testing.md#independent-expectations Hand-authored baked number/minimum=1 metadata defines the independent literal expected schema.
 * @evidence contracts/testing.md#distinguishing-cases The first document minimum becomes 999 while a fresh document must remain 1, distinguishing shared-object leakage.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Creates a Nest application and composes actual reflected route metadata; this pins the Nest reflection-to-composer connection rather than a separately installed server.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each invocation defines its own metadata inputs, creates one application and closes it in finally. Composition mutation stays confined to returned documents, while literal inputs establish fresh expected state.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_isolation retain the first document minimum becomes 999 while a fresh document must remain 1, distinguishing shared-object leakage.
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
