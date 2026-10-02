import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { Controller, INestApplication, Module, Query } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { OpenApi } from "typia";

import { HandWrittenMetadata } from "../internal/HandWrittenMetadata";
import { SwaggerParameterReader } from "../internal/SwaggerParameterReader";

@Controller("fallback")
class FallbackController {
  @core.TypedRoute.Get("baked")
  public baked(@Query() query: object): void {
    query;
  }

  @core.TypedRoute.Get("unbaked")
  public unbaked(@Query() query: object): void {
    query;
  }
}

@Module({ controllers: [FallbackController] })
class FallbackModule {}

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
 * 2. Compose the document at runtime with `NestiaSwaggerComposer`.
 * 3. Assert the baked route uses the baked schema, and the unbaked route falls
 *    back to the atomic schema, both omitting the `@internal`, `@hidden`, and
 *    `@ignore` members.
 *
 * @evidence contracts/testing.md#behavioral-verification Composes hand-authored metadata for baked and unbaked routes and checks schema precedence plus omission of internal/hidden/ignored members.
 * @evidence contracts/testing.md#independent-expectations The authored baked minimum=1 must survive; the unbaked atomic number has no minimum, and visibility annotations exclude those members.
 * @evidence contracts/testing.md#distinguishing-cases Baked and unbaked adjacent metadata differ only in property schemas; both retain visible and omit three visibility-marked members.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-parameters/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Creates a Nest application and composes actual reflected route metadata; this pins the Nest reflection-to-composer connection rather than a separately installed server.
 * @evidence contracts/e2e.md#shared-execution The swagger-parameters feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each invocation defines its own metadata inputs, creates one application and closes it in finally. Composition mutation stays confined to returned documents, while literal inputs establish fresh expected state.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_decomposed_fallback retain baked and unbaked adjacent metadata differ only in property schemas; both retain visible and omit three visibility-marked members.
 */
export const test_swagger_decomposed_fallback = async (): Promise<void> => {
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

  const app: INestApplication = await NestFactory.create(FallbackModule, {
    logger: false,
  });
  try {
    const document = (await NestiaSwaggerComposer.document(
      app,
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
  } finally {
    await app.close();
  }
};
