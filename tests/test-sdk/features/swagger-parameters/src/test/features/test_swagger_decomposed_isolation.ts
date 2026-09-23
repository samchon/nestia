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
