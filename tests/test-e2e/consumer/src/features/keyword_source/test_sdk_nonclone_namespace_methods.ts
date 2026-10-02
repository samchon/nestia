import assert from "node:assert/strict";

import api from "../../api_source";

/**
 * Verifies namespaced same-named controller methods retain separate source
 * operations.
 *
 * Distinct generated options must connect to the original producer classes;
 * imported type equality alone cannot certify their actual caller ABI.
 *
 * 1. Compile the generated binding under its own profile and original DTO graph.
 * 2. Execute independent literal calls on the existing shared adapter backend.
 *
 * @evidence contracts/testing.md#behavioral-verification North and South DuplicateController methods both remain generated and return their distinct literal strings through actual HTTP callers.
 * @evidence contracts/testing.md#independent-expectations The original two exported controller values independently return north and south and declare the two explicit route paths.
 * @evidence contracts/testing.md#distinguishing-cases Same class and method spellings contrast distinct namespaces, exported values, routes and response literals; the artifact reader independently checks both Swagger path entries.
 * @evidence contracts/testing.md#execution-ownership One matching export is discovered by the ordinary installed shared consumer after its single compilation and awaited per adapter.
 * @evidence contracts/e2e.md#necessary-boundary Actual installed source metadata, generated bindings and HTTP requests must agree; pure writer tests cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution Four additional SDK outputs and one automatic source-ABI E2E generation reuse the existing producer/consumer compiler requests and installation. The nonclone profiles share one separately counted no-listen app; this case acquires no app or compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Independent request values and scenario namespaces isolate calls; the common entry owns the sequential adapter backends and sandbox lifetime.
 * @evidence contracts/e2e.md#preserved-coverage This case owns the named profile/source bindings described here, alongside copied original collision/destructuring controls and separately preserved artifact assertions; it does not certify untransferred profiles from compile success.
 */

export const test_sdk_nonclone_namespace_methods = async (
  connection: api.IConnection,
): Promise<void> => {
  assert.equal(await api.functional.north.duplicate(connection), "north");
  assert.equal(await api.functional.south.duplicate(connection), "south");
};
