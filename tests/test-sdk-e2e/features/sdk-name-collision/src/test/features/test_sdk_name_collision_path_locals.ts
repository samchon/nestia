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
 * @evidence contracts/testing.md#behavioral-verification Generated path locals must escape variables/value/location while keeping loop key and arrow elem in their noncolliding scopes.
 * @evidence contracts/testing.md#independent-expectations The authored locals signature and lexical scopes establish four handwritten source needles, independently of generated naming decisions.
 * @evidence contracts/testing.md#distinguishing-cases The loop reads query values before the path key and the arrow has its own scope; both renamed and retained names are asserted.
 * @evidence contracts/testing.md#execution-ownership The matching test_sdk_name_collision_path_locals export is discovered and awaited by its feature executor after actual SDK generation and consumer compilation; rejection fails the report and zero cases fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary The actual native controller metadata and SDK printer must produce source consumed by the compiler; exact final text detects naming/documentation corruption not observable from an HTTP echo alone.
 * @evidence contracts/e2e.md#shared-execution This case shares packed dependency installation, compatible producer/runtime compilation and its already generated source with sibling cases; it does not prepare a new compiler per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Reads resolve from this case to its own generated feature outputs; it mutates neither source nor another member. The harness removes its copied tree after emitted execution finishes.
 * @evidence contracts/e2e.md#preserved-coverage All test_sdk_name_collision_path_locals assertions described above remain in this executable file, including its exact echoes/text or declared-shape and invalid-input controls; shared preparation does not replace them with compiler success.
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
