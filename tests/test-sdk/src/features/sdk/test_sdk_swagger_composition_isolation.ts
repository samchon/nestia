import { SwaggerCustomizer, SwaggerExample } from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { INestiaConfig } from "@nestia/sdk";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiExtension } from "@nestjs/swagger";
import { OpenApi } from "typia";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness as SwaggerParameterReader } from "./internal/SwaggerCompositionHarness";

@Controller("customized")
class CustomizedController {
  // Deliberately not idempotent: every edit appends or increments, so an edit
  // that leaks into the next composition shows up twice there.
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    const component = props.swagger.components.schemas![
      "IFallbackQuery"
    ] as OpenApi.IJsonSchema.IObject;
    component.description = `${component.description ?? "Item."} Customized.`;
    const parameter = props.route.parameters![0]!;
    parameter.schema.description = `${parameter.schema.description ?? ""}!`;
    (parameter.example as { visible: number }).visible += 1;
    (props.route as { "x-shared"?: { count: number } })["x-shared"]!.count += 1;
    props.swagger.servers![0]!.description += "!";
    props.swagger.info!.license!.name += "!";
    props.swagger.tags![0]!.description += "!";
    (
      props.swagger.components.securitySchemes!["bearer"] as {
        description?: string;
      }
    ).description += "!";
  })
  @ApiExtension("x-shared", { count: 0 })
  @Get()
  public get(
    @SwaggerExample.Parameter({ visible: 1 }) @Query() query: object,
  ): void {
    query;
  }
}

/**
 * Verifies composing a document never changes what the next composition starts
 * from, however a `SwaggerCustomizer` or the caller edits it.
 *
 * Route metadata and the configuration serve every composition in the process,
 * and the composed document used to hold their objects by reference: the baked
 * component and parameter schemas, the decorator example, the `@ApiExtension`
 * value, and the configured servers, license, tags, and security schemes. A
 * customizer's edit therefore reached every later document, and a
 * non-idempotent one stacked its edit once per composition (#1654). The
 * parameter stays undecomposed so its schema is the baked one and its example
 * the decorator's object.
 *
 * 1. Register baked metadata for one query route whose customizer appends to or
 *    increments every shared input, and compose three times with one config.
 * 2. Assert the three documents are equal, and each carries every edit once.
 * 3. Assert the config is unchanged.
 * 4. Edit a composed document directly and assert the next one is unaffected.
 *
 * @evidence contracts/testing.md#behavioral-verification Three compositions must be canonically identical, each eight customizer edits occur once, configuration remains unchanged, and caller title edit cannot reach a fourth composition.
 * @evidence contracts/testing.md#independent-expectations Non-idempotent authored customizer and initial handwritten metadata/config provide exact eight expected values; pre-call config snapshot tests nonmutation but is not the only oracle.
 * @evidence contracts/testing.md#distinguishing-cases Repeated composition, customizer mutation across eight input owners and direct caller mutation distinguish shared reference leaks.
 * @evidence contracts/testing.md#execution-ownership The test-sdk unit entry discovers this export and directly calls reflection, typed-route and Swagger composition owners over authored metadata. No Nest application, installation, native artifact, CLI or HTTP host is prepared.
 */
export const test_sdk_swagger_composition_isolation =
  async (): Promise<void> => {
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      HandWrittenMetadata.operation({ baked: true, members: [] }),
      CustomizedController.prototype,
      "get",
    );
    const config: Omit<INestiaConfig.ISwaggerConfig, "output"> = {
      decompose: false,
      servers: [{ url: "https://example.com", description: "Server" }],
      info: { title: "Isolation", license: { name: "MIT" } },
      tags: [{ name: "shared", description: "Tag" }],
      security: {
        bearer: { type: "http", scheme: "bearer", description: "Bearer" },
      },
    };
    const snapshot: string = SwaggerParameterReader.canonical(config);

    const routes = SwaggerParameterReader.routes(CustomizedController);
    const compose = async (): Promise<OpenApi.IDocument> =>
      (await SwaggerParameterReader.compose(
        routes,
        config,
      )) as OpenApi.IDocument;
    const documents: OpenApi.IDocument[] = [
      await compose(),
      await compose(),
      await compose(),
    ];
    for (const document of documents.slice(1))
      TestValidator.equals(
        "document",
        SwaggerParameterReader.canonical(document),
        SwaggerParameterReader.canonical(documents[0]),
      );

    const document: OpenApi.IDocument = documents[0]!;
    const operation = document.paths!["/customized"]!.get!;
    const parameter = operation.parameters![0]!;
    TestValidator.equals(
      "edits",
      SwaggerParameterReader.canonical([
        document.components.schemas!["IFallbackQuery"]!.description,
        parameter.schema.description,
        parameter.example,
        (operation as { "x-shared"?: unknown })["x-shared"],
        document.servers![0]!.description,
        document.info!.license!.name,
        document.tags![0]!.description,
        (
          document.components.securitySchemes!["bearer"] as {
            description?: string;
          }
        ).description,
      ]),
      SwaggerParameterReader.canonical([
        "Item. Customized.",
        "!",
        { visible: 2 },
        { count: 1 },
        "Server!",
        "MIT!",
        "Tag!",
        "Bearer!",
      ]),
    );
    TestValidator.equals(
      "config",
      SwaggerParameterReader.canonical(config),
      snapshot,
    );

    document.components.schemas!["IFallbackQuery"]!.title = "Edited";
    TestValidator.equals(
      "caller edit",
      (await compose()).components.schemas!["IFallbackQuery"]!.title,
      undefined,
    );
  };
