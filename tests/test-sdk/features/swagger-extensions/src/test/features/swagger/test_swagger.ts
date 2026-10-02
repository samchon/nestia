import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Checks the generated GET operation carries both ApiExtension values from its
 * controller decorations.
 *
 * @evidence contracts/testing.md#behavioral-verification Checks the generated GET operation carries both ApiExtension values from its controller decorations.
 * @evidence contracts/testing.md#independent-expectations The authored x-deprecated=true and x-visibility=public decorations define the exact vendor extension expectations.
 * @evidence contracts/testing.md#distinguishing-cases Boolean and string vendor extension values must both survive; ordinary operation fields remain permitted by the partial equality assertion.
 * @evidence contracts/testing.md#execution-ownership The feature DynamicExecutor entry swagger-extensions/src/test/index.ts discovers this exported test after the SDK harness prepares its generated consumer; this installed producer/consumer population is E2E, not a portable unit.
 * @evidence contracts/e2e.md#necessary-boundary Consumes artifacts emitted from the authored swagger-extensions controller program by the native metadata and SDK generation pipeline; the assertions detect loss across that producer/consumer connection.
 * @evidence contracts/e2e.md#shared-execution The swagger-extensions feature entry shares its generated Swagger/SDK artifacts and built consumer among the feature tests. The restored harness still prepares separate feature projects; this case does not perform another installation or compilation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The swagger-extensions test reads its current feature artifacts and does not edit them. The feature harness owns preparation and consumer lifetime; this declaration starts no background producer or persistent cache.
 * @evidence contracts/e2e.md#preserved-coverage The surviving assertions in test_swagger retain boolean and string vendor extension values must both survive; ordinary operation fields remain permitted by the partial equality assertion.
 */
export async function test_swagger(): Promise<void> {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../../swagger.json", "utf8"),
  );
  TestValidator.equals(
    "extension",
    {
      "x-deprecated": true,
      "x-visibility": "public",
    },
    swagger.paths["/performance"]!.get,
  );
}
