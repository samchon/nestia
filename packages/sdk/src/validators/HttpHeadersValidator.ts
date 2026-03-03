import {
  MetadataArrayType,
  MetadataFactory,
  MetadataSchema,
} from "@typia/core";

export namespace HttpHeadersValidator {
  export const validate = (
    meta: MetadataSchema,
    explore: MetadataFactory.IExplore,
  ): string[] => {
    const errors: string[] = [];
    const insert = (msg: string) => errors.push(msg);

    if (explore.top === true) {
      const expected: number =
        meta.atomics.length +
        meta.templates.length +
        meta.constants.map((c) => c.values.length).reduce((a, b) => a + b, 0) +
        meta.arrays.length;
      if (meta.size() !== expected)
        insert("Only atomic or array of atomic types are allowed.");
    } else if (
      explore.nested !== null &&
      explore.nested instanceof MetadataArrayType
    ) {
      const expected: number =
        meta.atomics.length +
        meta.templates.length +
        meta.constants.map((c) => c.values.length).reduce((a, b) => a + b, 0);
      if (meta.size() !== expected)
        insert("Only atomic types are allowed in array.");
    }
    return errors;
  };
}
