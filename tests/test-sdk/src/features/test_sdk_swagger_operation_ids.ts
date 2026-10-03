import assert from "assert/strict";

import { SwaggerOperationComposer } from "../../../../packages/sdk/lib/generates/internal/SwaggerOperationComposer";
import { SwaggerUnitRoute } from "../internal/SwaggerUnitRoute";

/**
 * Verifies operationId defaults, callback inputs and explicit-tag precedence.
 *
 * The shared producer retains the real metadata connection for callback and
 * tagged controllers. Selection itself needs no separate product compilation;
 * the unset callback and empty explicit value also distinguish default
 * branches.
 *
 * 1. Compose an authored empty route with no ID configuration.
 * 2. Capture the configured callback's exact class/method/path input.
 * 3. Supply explicit IDs and require the callback to remain uncalled.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SwaggerOperationComposer.compose returns undefined without configuration, uses the callback's authored result and forwards its exact route properties, and prefers explicit nonempty or empty IDs without invoking the callback.
 * @evidence contracts/testing.md#independent-expectations The public operationId contract takes class, function, HTTP method and route path; an explicit operation ID overrides generation. Literal authored route identities and callback results establish expectations independently of composed output.
 * @evidence contracts/testing.md#distinguishing-cases Omitted configuration, a configured callback, an explicit authored ID and an explicit empty ID distinguish default, generation and nullish-precedence branches. The shared installed callback/tag case owns native metadata-to-document assembly.
 * @evidence contracts/testing.md#execution-ownership The SDK unit executor discovers this matching export with plugins off against caller-built artifacts. It directly composes authored in-memory input and creates no consumer, compiler, host or process.
 */
export const test_sdk_swagger_operation_ids = (): void => {
  const route = SwaggerUnitRoute();
  const document = {
    openapi: "3.2.0" as const,
    info: { title: "Unit", version: "1" },
    paths: {},
    components: {},
    "x-typia-emended-v12": true as const,
  };
  const compose = (
    operationId?: (props: {
      class: string;
      function: string;
      method: "GET";
      path: string;
    }) => string,
  ) =>
    SwaggerOperationComposer.compose({
      route,
      document,
      config: { operationId },
      schema: () => undefined,
    });
  assert.equal(compose().operationId, undefined);
  let calls = 0;
  const callback = (props: {
    class: string;
    function: string;
    method: "GET";
    path: string;
  }): string => {
    ++calls;
    assert.deepEqual(props, {
      class: "UnitSwaggerController",
      function: "get",
      method: "GET",
      path: "/unit",
    });
    return "callback-result";
  };
  assert.equal(compose(callback).operationId, "callback-result");
  assert.equal(calls, 1);
  for (const id of ["authored-result", ""]) {
    route.operationId = id;
    assert.equal(compose(callback).operationId, id);
    assert.equal(calls, 1);
  }
};
