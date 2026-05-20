import { MetadataSchema, sizeOf } from "../internal/legacy";

export namespace TextPlainValidator {
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
