import { Controller, Get } from "@nestjs/common";
import assert from "assert/strict";

import { HandWrittenMetadata } from "./internal/HandWrittenMetadata";
import { SwaggerCompositionHarness } from "./internal/SwaggerCompositionHarness";

@Controller("invalid")
class InvalidRouteController {
  @Get()
  public get(): void {}
}

/**
 * Verifies authored bigint response metadata is refused before Swagger
 * composition.
 *
 * JSON cannot represent bigint. Analysis must attribute that failure to the
 * method and its success metadata; a valid void twin prevents blanket
 * rejection.
 *
 * 1. Analyze explicitly authored bigint response metadata.
 * 2. Assert the failed route, return attribution and bigint reason.
 * 3. Replace only the response metadata with void and require one valid route.
 *
 * @evidence contracts/testing.md#behavioral-verification Direct reflection and typed-route analysis returns no route for bigint and identifies InvalidRouteController.get, success and bigint; valid void metadata yields one route and no errors.
 * @evidence contracts/testing.md#independent-expectations JSON serialization prohibits bigint and accepts void as an absent response; handcrafted metadata and exact class/function identities establish expectations independently.
 * @evidence contracts/testing.md#distinguishing-cases Invalid bigint contrasts valid void on the same method. Route count, success attribution and reason rule out unrelated controller recognition or parameter failures.
 * @evidence contracts/testing.md#execution-ownership The test-sdk unit entry discovers this matching export and calls analyzers directly over authored metadata. No application, native compiler, process or installation starts. The shared E2E application retains the public composer/report assembly boundary.
 */
export const test_sdk_swagger_metadata_errors = (): void => {
  const metadata = {
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

  const invalid = SwaggerCompositionHarness.analyze(InvalidRouteController);
  assert.deepEqual(invalid.routes, []);
  assert.ok(
    invalid.errors.some(
      (error) =>
        error.class === "InvalidRouteController" &&
        error.function === "get" &&
        error.from === "success" &&
        JSON.stringify(error.contents).includes("bigint"),
    ),
    JSON.stringify(invalid.errors),
  );
  Reflect.defineMetadata(
    "nestia/OperationMetadata",
    {
      ...metadata,
      success: HandWrittenMetadata.operation({ baked: true, members: [] })
        .success,
    },
    InvalidRouteController.prototype,
    "get",
  );
  const valid = SwaggerCompositionHarness.analyze(InvalidRouteController);
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.routes.length, 1);
};
