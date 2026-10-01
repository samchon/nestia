import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";

import api from "@api";

/**
 * Verifies global prefix exclusions keep matching routes unprefixed in SDK and
 * Swagger output.
 *
 * Locks the `setGlobalPrefix(prefix, { exclude })` branch used by NestJS for
 * health-check style endpoints. The SDK analyzer already reads the global
 * prefix metadata, so this test pins the missing step: deciding per route
 * whether the prefix applies before composing generated accessors and Swagger
 * paths.
 *
 * 1. Generate an app with global prefix `x` and `/_ah/warmup` excluded.
 * 2. Call the generated SDK accessor for the unprefixed warmup route.
 * 3. Assert Swagger exposes `/_ah/warmup` and not `/x/_ah/warmup`.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated unprefixed warmup accessor must return literal ok, the document must contain /_ah/warmup and must omit /x/_ah/warmup.
 * @evidence contracts/testing.md#independent-expectations The authored Backend sets prefix x with /_ah/warmup excluded and the warmup controller returns ok. Those inputs establish the expected paths and payload independently of SDK generation.
 * @evidence contracts/testing.md#distinguishing-cases A matching excluded route contrasts its explicitly forbidden prefixed spelling; sibling generated prefix requests own nonexcluded routes. The document assertions check existence, not the full operation schema.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor discovers and awaits this matching exported function against its generated clients and actual backend; each mismatch rejects the feature report.
 * @evidence contracts/e2e.md#necessary-boundary This connects actual setGlobalPrefix exclusion routing, generated HTTP accessor transport and serialized Swagger path composition; a path utility unit cannot prove client and host agree.
 * @evidence contracts/e2e.md#shared-execution All route assertions reuse the feature SDK, generated document and backend. Compatible cohorts share CLI loading and runtime compilation; application-input configuration retains its real configured Nest application rather than a synthetic file-only substitute.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Authored applications and outputs belong to the isolated feature port/tree. The feature entry finally closes its backend after success, discovery or assertion failure; any WebSocket connector in this case closes in its own finally.
 * @evidence contracts/e2e.md#preserved-coverage Every original direct status, document path, generated payload and WebSocket assertion remains executable. Neighboring prefix and versioning fixtures retain their distinct configurations and routes.
 */
export const test_api_global_prefix_exclude = async (
  connection: api.IConnection,
): Promise<void> => {
  const output: string = await api.functional._ah.warmup(connection);
  TestValidator.equals("output", output, "ok");

  const swagger = JSON.parse(
    await fs.promises.readFile(
      path.join(__dirname, "../../../../swagger.json"),
      "utf8",
    ),
  );
  TestValidator.equals(
    "unprefixed swagger path",
    swagger.paths["/_ah/warmup"] !== undefined,
    true,
  );
  TestValidator.equals(
    "prefixed swagger path",
    swagger.paths["/x/_ah/warmup"],
    undefined,
  );
};
