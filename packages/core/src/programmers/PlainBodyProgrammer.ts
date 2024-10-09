import ts from "typescript";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformContext } from "../options/INestiaTransformProject";

export namespace PlainBodyProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.Expression => {
    const result = MetadataFactory.analyze({
      checker: props.context.checker,
      transformer: props.context.transformer,
      options: {
        escape: false,
        constant: true,
        absorb: true,
        validate,
      },
      collection: new MetadataCollection(),
      type: props.type,
    });
    if (result.success === false)
      throw TransformerError.from({
        code: "nestia.core.TypedParam",
        errors: result.errors,
      });
    return AssertProgrammer.write({
      context: {
        ...props.context,
        options: {
          numeric: false,
          finite: false,
          functional: false,
        },
      },
      modulo: props.modulo,
      config: {
        equals: false,
        guard: false,
      },
      type: props.type,
      name: undefined,
    });
  };
}

const validate = (metadata: Metadata): string[] => {
  const errors: string[] = [];
  const insert = (msg: string) => errors.push(msg);

  const expected: number =
    (metadata.atomics.some((a) => a.type === "string") ? 1 : 0) +
    metadata.templates.length +
    metadata.constants
      .filter((c) => c.type === "string")
      .map((c) => c.values.length)
      .reduce((a, b) => a + b, 0);
  if (expected === 0 || expected !== metadata.size())
    insert(`only string type is allowed`);
  if (metadata.isRequired() === false) insert(`do not allow undefindable type`);
  if (metadata.nullable === true) insert(`do not allow nullable type`);
  else if (metadata.any === true) insert(`do not allow any type`);

  return errors;
};
