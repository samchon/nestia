import { TestValidator } from "@nestia/e2e";

/**
 * Checks the original literal array-mutability and object-property
 * distinctions.
 *
 * 1. Select each authored property from one generated component schema.
 * 2. Compare its array extension and readOnly values with the original literals.
 *
 * @evidence contracts/common.md#principled-implementation The seven authored property shapes independently distinguish array immutability from object-property readOnly. Original literal true/undefined comparisons remain for both interface and alias callers.
 * @evidence contracts/common.md#clear-and-simple-design One reader accepts a label and actual generated schema and applies the same finite property comparisons. Parsing, generation and discovery stay with the case.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This helper retains the original comparisons without manufacturing schema values, replacing generator behavior or deriving expectations from output.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the array versus property meaning and the two comparison steps; labels retain original per-property failure identity.
 */
export const assertReadonlyArraySchema = (label: string, schema: any): void => {
  const properties = schema.properties as Record<string, any>;
  const mutable = properties.mutable!;
  const misleadingObject = properties.misleadingObject!;
  const misleadingAlias = properties.misleadingAlias!;
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
    `${label} misleading object name`,
    misleadingObject["x-readonly-array"],
    undefined,
  );
  TestValidator.equals(
    `${label} misleading mutable alias name`,
    misleadingAlias["x-readonly-array"],
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
