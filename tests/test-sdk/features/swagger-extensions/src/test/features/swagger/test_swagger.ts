import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies swagger.
 *
 * @evidence contracts/testing.md#behavioral-verification The performance GET operation must contain x-deprecated:true and x-visibility:public.
 * @evidence contracts/testing.md#independent-expectations Authored ApiExtension decorators supply both literal values. Expected-first TestValidator.equals intentionally checks only these extension keys, allowing unrelated ordinary operation fields.
 * @evidence contracts/testing.md#distinguishing-cases Boolean and string extensions retain distinct value types; this is a selected-field assertion, not equality of the entire operation.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-extensions siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
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
