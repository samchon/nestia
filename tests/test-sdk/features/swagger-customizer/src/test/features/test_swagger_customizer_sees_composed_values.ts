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
 * @evidence contracts/testing.md#behavioral-verification A moved operation retains the later x-after-move edit, the old path disappears and the bigint example becomes exact digits12345678901234567890.
 * @evidence contracts/testing.md#independent-expectations Authored path-moving/later-edit/bigint-converting customizers determine the literal new/old paths and digit string independently of composed output.
 * @evidence contracts/testing.md#distinguishing-cases Customizer ordering, changed operation location and a pre-JSON bigint value contrast independent copy/lookup/serialization paths.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_customizer_sees_composed_values export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_customizer_sees_composed_values selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
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
