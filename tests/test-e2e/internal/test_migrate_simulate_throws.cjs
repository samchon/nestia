const assert = require("node:assert/strict");
const path = require("node:path");

/**
 * Verifies the compiled positional migration simulator rejects bad headers.
 *
 * Swallowed validation errors incorrectly resolve a propagation object in
 * place of the route's typed response.
 *
 * 1. Call emitted SDK with its required authorization header absent.
 * 2. Require HttpError 400, then permit the otherwise identical valid call.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual emitted articles.index runs its typia simulator; absent authorization rejects HttpError 400 and valid authorization resolves.
 * @evidence contracts/testing.md#independent-expectations Authored IRequestHeaders requires authorization and nonpropagating fetch throws HttpError 400; those contracts establish the expected rejection.
 * @evidence contracts/testing.md#distinguishing-cases Calls differ only by authorization, detecting swallowed errors and unconditional rejection with the same empty query.
 * @evidence contracts/testing.md#execution-ownership Common start invokes this after the sole consumer compilation using current emitted output.
 * @evidence contracts/e2e.md#necessary-boundary Emitted validators and simulator execution prove installed compiler/runtime connection that generated text cannot establish.
 * @evidence contracts/e2e.md#shared-execution Both calls reuse positional SDK from the one consumer; no network, host, generation or compiler starts.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Current sandbox output loads by absolute path; each call owns fresh headers/connection and caller cleanup runs after settlement.
 * @evidence contracts/e2e.md#preserved-coverage Original invalid-header class/status and valid-header resolution remain. Randomized output is never substituted for request validation.
 */
const test_migrate_simulate_throws = async ({ sandbox }) => {
  const api = require(path.join(sandbox, ".consumer/migration/sdk-positional/src/index.js"));
  const call = (headers) => api.functional.articles.index({
    host: "http://127.0.0.1:1", simulate: true, headers,
  }, {});
  const status = await call().then(() => "resolved", (error) => error.constructor.name + " " + error.status);
  assert.equal(status, "HttpError 400");
  await call({ authorization: "Bearer token" });
};

module.exports = { test_migrate_simulate_throws };
