import { Metadata } from "typia/lib/schemas/metadata/Metadata";

export namespace TextPlainValidator {
  export const validate = (metadata: Metadata): string[] => {
    const expected: number =
      metadata.atomics.filter((a) => a.type === "string").length +
      metadata.constants
        .filter((c) => c.type === "string")
        .map((c) => c.values.length)
        .reduce((a, b) => a + b, 0) +
      metadata.templates.length +
      metadata.natives.filter((n) => n === "String").length;
    if (metadata.size() === 0 || metadata.size() !== expected)
      return [`Only string type is allowed in the "text/plain" content type.`];
    return [];
  };
}
