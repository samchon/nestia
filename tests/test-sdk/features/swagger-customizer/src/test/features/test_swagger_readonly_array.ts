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
