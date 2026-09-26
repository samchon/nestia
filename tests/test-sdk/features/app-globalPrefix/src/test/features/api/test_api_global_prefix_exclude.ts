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
