import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies `path()` escapes each of its locals only against the parameters the
 * local can see.
 *
 * The SDK escapes its own identifiers so a user parameter keeps its name
 * (#1647), but only a name the local would actually shadow is a collision. The
 * loop's `key` and `value` see the query values their header reads, not the
 * path parameters read after the loop, and the arrow's `elem` sees none, so
 * renaming them for a path parameter named alike would change the SDK of a
 * route that has no collision.
 *
 * 1. Read the generated SDK file of `ShadowController`.
 * 2. Assert the `locals` route, whose path parameter is `key` and whose query keys
 *    are `value`, `location`, `variables`, and `elem`, keeps `key` and `elem`
 *    and escapes `value`, `location`, and `variables`.
 *
 * @evidence contracts/testing.md#behavioral-verification The assertions require that fresh path code escapes variables/value/location while retaining key/elem where no lexical collision exists.
 * @evidence contracts/testing.md#independent-expectations Expectations come from TypeScript lexical scope and controller parameter visibility, independently of the generated client's computation.
 * @evidence contracts/testing.md#distinguishing-cases This case owns visible generated-local collisions versus identical spelling outside that local's scope.
 * @evidence contracts/testing.md#execution-ownership The sdk-name-collision fixture DynamicExecutor discovers this authored export after SDK generation/compilation; tests/test-sdk/start.js owns preparation and its test entry owns execution.
 * @evidence contracts/e2e.md#necessary-boundary The public generated source/document is fresh generator output; a backend request cannot establish its required spelling.
 * @evidence contracts/e2e.md#shared-execution The sdk-name-collision runner prepares its generated SDK once for this fixture's exports and shares its backend for request cases. Controller/options inputs differ from other fixtures; this export adds no SDK installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture entry owns backend shutdown; per-call inputs and observation arrays belong to this export. Connector-owning cases close them in finally. Artifact and process identity belong to the sdk-name-collision fixture runner.
 * @evidence contracts/e2e.md#preserved-coverage The asserted visible generated-local collisions versus identical spelling outside that local's scope distinctions remain in this export; bare health calls removed from this scope added no result assertions beyond the surviving typed-response, HEAD, RPC or upload cases.
 */
export const test_sdk_name_collision_path_locals = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/shadow/index.ts`,
    "utf8",
  );
  for (const needle of [
    "const _variables: URLSearchParams = new URLSearchParams();",
    "for (const [key, _value] of Object.entries({",
    "_value.forEach((elem: any) => _variables.append(key, String(elem)));",
    "const _location: string = `/shadow/locals/${PathParameter.encode(",
  ])
    TestValidator.equals(needle, content.includes(needle), true);
};
