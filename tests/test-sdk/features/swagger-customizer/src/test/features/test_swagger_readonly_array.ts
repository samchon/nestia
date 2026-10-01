import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import { OpenApi } from "typia";

/**
 * Verifies readonly array type positions are emitted as a vendor extension
 * without conflating them with readonly object properties.
 *
 * Locks the generated Swagger distinction between `prop: readonly T[]` and
 * `readonly prop: T[]` for both interface and type-alias DTO declarations.
 * OpenAPI `readOnly` already means response-only property, so the SDK must
 * expose TypeScript array immutability through `x-readonly-array` while
 * preserving existing property mutability behavior.
 *
 * 1. Generate Swagger from a controller returning interface and type-alias shapes
 *    containing both readonly arrays and readonly properties.
 * 2. Read the generated component schemas from `swagger.json`.
 * 3. Assert only the array-type cases carry `x-readonly-array`.
 *
 * @evidence contracts/testing.md#behavioral-verification Five properties in both interface and alias must distinguish mutable arrays, readonly array types, readonly object properties and both readonly forms.
 * @evidence contracts/testing.md#independent-expectations Handwritten TypeScript declarations establish x-readonly-array for type-position immutability and readOnly for property modifiers; explicit true/undefined cells do not derive from generated schemas.
 * @evidence contracts/testing.md#distinguishing-cases T[] versus readonly T[] versus ReadonlyArray<T> and readonly property versus both are asserted separately in two declaration forms.
 * @evidence contracts/testing.md#execution-ownership The matching test_swagger_readonly_array export is discovered and awaited by its feature executor after native generation and emitted consumer execution; a failed assertion rejects its report and zero discovery fails the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual controller decorators/JSDoc/type metadata and final SDK or Swagger printing must connect through the native producer and installed generator. Isolated hand-constructed schema tests cannot certify these authored metadata inputs reach serialized output.
 * @evidence contracts/e2e.md#shared-execution The swagger-customizer siblings consume one generated artifact population and share packed installation, compatible producer/runtime compilation and their entry-owned backend. These file/metadata assertions launch no compiler or application of their own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each case reads its own feature’s generated files or local SDK namespace, with paths anchored at __dirname. Submitted method-key values are local where applicable; entry/backend and harness/copied-tree ownership enclose execution.
 * @evidence contracts/e2e.md#preserved-coverage All test_swagger_readonly_array selected flags, text, example shapes, visibility or method-key controls above remain in this executed owner. Compatible preparation sharing neither removes them nor substitutes compiler success for their assertions.
 */
export const test_swagger_readonly_array = async (): Promise<void> => {
  const content: string = await fs.promises.readFile(
    `${__dirname}/../../../swagger.json`,
    "utf8",
  );
  const swagger: OpenApi.IDocument = JSON.parse(content);
  assertReadonlyArraySchema(
    "interface",
    swagger.components!.schemas!.IReadonlyArrayDto as any,
  );
  assertReadonlyArraySchema(
    "type alias",
    swagger.components!.schemas!.IReadonlyArrayAliasDto as any,
  );
};

const assertReadonlyArraySchema = (label: string, schema: any): void => {
  const properties = schema.properties as Record<string, any>;
  const mutable = properties.mutable!;
  const readonlyArray = properties.readonlyArray!;
  const readonlyGeneric = properties.readonlyGeneric!;
  const readonlyProperty = properties.readonlyProperty!;
  const readonlyBoth = properties.readonlyBoth!;

  TestValidator.equals(
    `${label} mutable`,
    mutable["x-readonly-array"],
    undefined,
  );
  TestValidator.equals(
    `${label} readonlyArray extension`,
    readonlyArray["x-readonly-array"],
    true,
  );
  TestValidator.equals(
    `${label} readonlyArray readOnly`,
    readonlyArray.readOnly,
    undefined,
  );
  TestValidator.equals(
    `${label} readonlyGeneric extension`,
    readonlyGeneric["x-readonly-array"],
    true,
  );
  TestValidator.equals(
    `${label} readonlyGeneric readOnly`,
    readonlyGeneric.readOnly,
    undefined,
  );
  TestValidator.equals(
    `${label} readonlyProperty extension`,
    readonlyProperty["x-readonly-array"],
    undefined,
  );
  TestValidator.equals(
    `${label} readonlyProperty readOnly`,
    readonlyProperty.readOnly,
    true,
  );
  TestValidator.equals(
    `${label} readonlyBoth extension`,
    readonlyBoth["x-readonly-array"],
    true,
  );
  TestValidator.equals(
    `${label} readonlyBoth readOnly`,
    readonlyBoth.readOnly,
    true,
  );
};
