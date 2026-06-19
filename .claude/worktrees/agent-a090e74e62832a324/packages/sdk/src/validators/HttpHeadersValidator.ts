import {
  MetadataArrayType,
  MetadataFactory,
  MetadataSchema,
} from "@typia/core";

export namespace HttpHeadersValidator {
  export const validate = (props: {
    metadata: MetadataSchema;
    explore: MetadataFactory.IExplore;
  }): string[] => {
    const errors: string[] = [];
    const insert = (msg: string) => errors.push(msg);

    if (props.explore.top === true) {
      const expected: number =
        props.metadata.atomics.length +
        props.metadata.templates.length +
        props.metadata.constants
          .map((c) => c.values.length)
          .reduce((a, b) => a + b, 0) +
        props.metadata.arrays.length;
      if (props.metadata.size() !== expected)
        insert("Only atomic or array of atomic types are allowed.");
    } else if (
      props.explore.nested !== null &&
      props.explore.nested instanceof MetadataArrayType
    ) {
      const expected: number =
        props.metadata.atomics.length +
        props.metadata.templates.length +
        props.metadata.constants
          .map((c) => c.values.length)
          .reduce((a, b) => a + b, 0);
      if (props.metadata.size() !== expected)
        insert("Only atomic types are allowed in array.");
    }
    return errors;
  };
}
