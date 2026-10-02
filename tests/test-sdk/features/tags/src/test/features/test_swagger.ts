import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Validates the generated consumer result.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that fresh Swagger POST/PUT operations combine bbs/public/write tags.
 * @evidence contracts/testing.md#independent-expectations Expectations come from controller ApiTags and method decorator/JSDoc tags, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns JSDoc POST tags versus decorator PUT tags with inherited controller tag.
 * @evidence contracts/testing.md#execution-ownership The tags fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary The public generated source/document is fresh generator output; a backend request cannot establish its required spelling.
 * @evidence contracts/e2e.md#shared-execution The tags runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the tags fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted JSDoc POST tags versus decorator PUT tags with inherited controller tag distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_swagger = async (): Promise<void> => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  TestValidator.equals(
    "tags of store()",
    swagger.paths["/bbs/articles/{section}"].post.tags,
    ["bbs", "public", "write"],
  );
  TestValidator.equals(
    "tags of update()",
    swagger.paths["/bbs/articles/{section}/{id}"].put.tags,
    ["bbs", "public", "write"],
  );
};
