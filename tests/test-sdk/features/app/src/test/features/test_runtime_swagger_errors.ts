import core from "@nestia/core";
import { TestValidator } from "@nestia/e2e";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { Controller, INestApplication, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

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

/**
 * Verifies Swagger composition rejects invalid route metadata without leaking
 * resources.
 *
 * Why: A controller can contain an unsupported return shape, and the public
 * composer must report that analysis failure while the temporary Nest
 * application closes.
 *
 * 1. Register invalid operation metadata on an isolated controller.
 * 2. Assert composition fails and close the application in every outcome.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes NestiaSwaggerComposer.document with bigint response metadata and requires rejection.
 * @evidence contracts/testing.md#independent-expectations OpenAPI JSON response metadata excludes bigint; authored metadata explicitly supplies that forbidden atomic.
 * @evidence contracts/testing.md#distinguishing-cases An isolated invalid controller is rejected; test_runtime_swagger owns the successful document control.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Invokes NestiaSwaggerComposer.document with bigint response metadata and requires rejection. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage An isolated invalid controller is rejected; test_runtime_swagger owns the successful document control. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
 */
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
