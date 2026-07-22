import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { Controller, INestApplication, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import typia, { OpenApi } from "typia";

@Controller("invalid")
class InvalidRouteController {
  @core.TypedRoute.Get()
  public get(): string {
    return "valid";
  }
}

@Module({
  controllers: [InvalidRouteController],
})
class InvalidRouteModule {}

export const test_runtime_swagger = async (): Promise<void> => {
  const response: Response = await fetch(
    `http://127.0.0.1:${process.env.TEST_SDK_PORT ?? 37_000}/api-json`,
  );
  const document: OpenApi.IDocument = await response.json();
  typia.assert(document);
};

export const test_runtime_swagger_errors = async (): Promise<void> => {
  const metadata: any = {
    parameters: [],
    success: {
      type: { name: "bigint" },
      imports: [],
      primitive: {
        success: true,
        data: {
          components: { aliases: [], arrays: [], objects: [], tuples: [] },
          metadata: {
            aliases: [],
            any: false,
            arrays: [],
            atomics: [{ type: "bigint", tags: [] }],
            constants: [],
            escaped: null,
            functions: [],
            maps: [],
            natives: [],
            nullable: false,
            objects: [],
            optional: false,
            required: true,
            rest: null,
            sets: [],
            templates: [],
            tuples: [],
          },
        },
      },
      resolved: { success: false, errors: [] },
    },
    exceptions: [],
    description: null,
    jsDocTags: [],
  };
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    metadata,
    InvalidRouteController.prototype,
    "get",
  );

  const app: INestApplication = await NestFactory.create(InvalidRouteModule, {
    logger: false,
  });
  try {
    await TestValidator.error("route-analysis errors", () =>
      NestiaSwaggerComposer.document(app, {}),
    );
  } finally {
    await app.close();
  }
};
