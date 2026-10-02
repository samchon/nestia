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
