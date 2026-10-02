import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies customizers edit the operations and values the routes composed.
 *
 * Composition copies the document before the customizers run, so their edits
 * cannot reach route metadata (#1654). The copy must not change what they
 * receive: each customizer gets its own route's operation even after an earlier
 * one moved its path, and an example JSON cannot hold reaches the customizer
 * that converts it, instead of failing the composition.
 *
 * 1. Read the generated Swagger document.
 * 2. Assert the route whose first customizer moved its path carries the second
 *    customizer's edit at the new path, and nothing is left at the old one.
 * 3. Assert the bigint example arrives as the digits its customizer wrote.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks the moved route receives the later customizer edit, the original path disappears and a bigint example becomes its authored decimal string.
 * @evidence contracts/testing.md#independent-expectations The two ordered customizers and exact bigint digits establish the expected move, edit and conversion.
 * @evidence contracts/testing.md#distinguishing-cases Moved versus original paths and a value outside JSON number semantics distinguish stale-route lookup and premature serialization.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-customizer/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-customizer controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-customizer test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger_customizer_sees_composed_values retain moved versus original paths and a value outside JSON number semantics distinguish stale-route lookup and premature serialization.
 */
export const test_swagger_customizer_sees_composed_values =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    TestValidator.equals(
      "moved operation",
      swagger.paths["/custom/moved"]?.get?.["x-after-move"],
      true,
    );
    TestValidator.equals(
      "old path",
      swagger.paths["/custom/movable"],
      undefined,
    );
    TestValidator.equals(
      "bigint example",
      swagger.paths["/custom/bigint/{value}"].get.parameters[0].example,
      "12345678901234567890",
    );
  };
