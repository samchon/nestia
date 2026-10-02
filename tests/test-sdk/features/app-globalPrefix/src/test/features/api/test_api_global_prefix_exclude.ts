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
 * @evidence contracts/testing.md#behavioral-verification Calls the excluded warmup SDK route and checks both present unprefixed and absent prefixed Swagger paths.
 * @evidence contracts/testing.md#independent-expectations The authored warmup route is explicitly excluded from global prefix x and returns ok.
 * @evidence contracts/testing.md#distinguishing-cases The unprefixed positive path and prefixed negative path distinguish prefix exclusion.
 * @evidence contracts/testing.md#execution-ownership The exported case is discovered by the feature src/test/index.ts after start.js compiles the generated consumer; compiler and host preparation make this an E2E population.
 * @evidence contracts/e2e.md#necessary-boundary Calls the excluded warmup SDK route and checks both present unprefixed and absent prefixed Swagger paths. The assertion observes generated output or its connected consumer, rather than a committed repository arrangement.
 * @evidence contracts/e2e.md#shared-execution The feature runner shares generation and prepared artifacts with its sibling cases. Compatible programs are batched by start.js; distinct feature programs still incur separate consumer/host preparation, which is an unresolved suite consolidation limitation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity This case consumes the feature-specific generated artifacts and connection; local connector, application or temporary consumer cleanup is owned by its try/finally where created. Outer backend lifecycle belongs to the feature entry and exceptional startup cleanup remains a harness limitation.
 * @evidence contracts/e2e.md#preserved-coverage The unprefixed positive path and prefixed negative path distinguish prefix exclusion. Existing assertions remain at this executable owner; no branch is removed or claimed to be transferred to units.
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
