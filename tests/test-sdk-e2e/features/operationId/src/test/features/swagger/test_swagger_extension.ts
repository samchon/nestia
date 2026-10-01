import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies `@ApiExtension()` values reach the Swagger operation of their route.
 *
 * Locks the extension branch of the Swagger operation composer: each
 * `@ApiExtension(name, value)` becomes a vendor field of the operation it
 * decorates, with the value's type preserved. A regression in the reflect read
 * would drop the fields or stringify the boolean.
 *
 * 1. Read the generated Swagger document.
 * 2. Take the `GET /performance` operation, which carries a string and a boolean
 *    extension.
 * 3. Assert both fields are present with their authored values and types.
 *
 * @evidence contracts/testing.md#behavioral-verification The performance GET operation must contain x-deprecated:true and x-visibility:public.
 * @evidence contracts/testing.md#independent-expectations Authored ApiExtension decorators supply both literal values. Expected-first TestValidator.equals intentionally checks only these extension keys, allowing unrelated ordinary operation fields.
 * @evidence contracts/testing.md#distinguishing-cases Boolean and string extensions retain distinct value types; this is a selected-field assertion, not equality of the entire operation, and the sibling routes of the feature carry none.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_extension export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators and final Swagger printing must connect through the native producer and installed generator; the real @nestjs/swagger decorator's stored metadata is what the generator reads.
 * @evidence contracts/e2e.md#shared-execution The operationId siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. This file assertion launches no compiler or application of its own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The case reads its own feature's generated swagger.json anchored at __dirname and keeps no state.
 * @evidence contracts/e2e.md#preserved-coverage This is the former swagger-extensions assertion, unchanged; that feature shared the Health/Performance DTO set of this feature, so its metadata collection is not merged with a different one.
 */
export async function test_swagger_extension(): Promise<void> {
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
