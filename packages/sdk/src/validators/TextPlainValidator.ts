import { MetadataSchema, sizeOf } from "../internal/legacy";

/**
 * Validates that a type can be a `text/plain` body or response.
 *
 * @evidence contracts/common.md#principled-implementation A plain text body is a string, so the type may hold only string forms.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule follows the content type.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace TextPlainValidator {
  /**
   * Returns an error message unless every member of the metadata is a string, a
   * string constant, a string template, or the native String.
   *
   * @evidence contracts/common.md#principled-implementation The number of string forms is counted and compared with the size of the metadata, so any other form makes the counts differ, and an empty type is also refused.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The count is exact and no type is special-cased.
   * @evidence contracts/common.md#meaningful-documentation The comment states the accepted forms.
   */
  export const validate = (props: { metadata: MetadataSchema }): string[] => {
    const expected: number =
      props.metadata.atomics.filter((a) => a.type === "string").length +
      props.metadata.constants
        .filter((c) => c.type === "string")
        .map((c) => c.values.length)
        .reduce((a, b) => a + b, 0) +
      props.metadata.templates.length +
      props.metadata.natives.filter((n) => n.name === "String").length;
    if (sizeOf(props.metadata) === 0 || sizeOf(props.metadata) !== expected)
      return [`Only string type is allowed in the "text/plain" content type.`];
    return [];
  };
}
