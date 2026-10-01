import core from "@nestia/core";
import { NestiaSwaggerComposer } from "@nestia/sdk";
import { Controller, INestApplication, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import assert from "node:assert/strict";

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
 * @evidence contracts/testing.md#behavioral-verification The public composer must reject real registered controller metadata and identify InvalidRouteController.get() plus bigint. Unrelated host failures cannot satisfy the rejection predicate.
 * @evidence contracts/testing.md#independent-expectations The deliberately authored public OperationMetadata fixture describes a bigint response, which the JSON response contract prohibits. No current generator output supplies this rejection expectation.
 * @evidence contracts/testing.md#distinguishing-cases The invalid bigint metadata contrasts successful empty/nonempty composition siblings. This owns consumer-provided metadata rejection, not native metadata extraction; matching route and reason fragments does not assert full diagnostic wording.
 * @evidence contracts/testing.md#execution-ownership The matching exported function is discovered and awaited by its feature DynamicExecutor after real generation and compilation; every retained assertion rejection fails the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects real Nest controller registration, public reflection metadata consumption and composer analysis failure. It does not claim manually supplied metadata proves the native producer.
 * @evidence contracts/e2e.md#shared-execution Consumer packages and runtime compilation are shared with sibling feature cases and compatible cohorts. Separate preparation inside this case exists only for the explicitly described host boundary; native dispatch and Node processes are shared while each member keeps its own compiler programs and metadata scope.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity One isolated application keeps deliberately invalid metadata outside the ordinary feature host. The metadata belongs to this local class and the application finally closes after either rejection or unexpected resolution.
 * @evidence contracts/e2e.md#preserved-coverage All original meaningful requests and composition connections remain. Exact payload/default/path or diagnostic assertions strengthen previously shape-only, completion-only or generic-rejection checks; complementary sibling scenarios remain executable.
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
    await assert.rejects(
      () => NestiaSwaggerComposer.document(app, {}),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("InvalidRouteController.get()") &&
        error.message.includes("bigint"),
    );
  } finally {
    await app.close();
  }
};
