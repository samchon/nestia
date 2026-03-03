import {
  HttpAssertQueryProgrammer,
  HttpIsQueryProgrammer,
  HttpQueryProgrammer,
  HttpValidateQueryProgrammer,
  ITypiaContext,
  LlmSchemaProgrammer,
  MetadataFactory,
  MetadataSchema,
  MetadataStorage,
  TransformerError,
} from "@typia/core";
import { ValidationPipe } from "@typia/interface";
import ts from "typescript";

import { INestiaTransformOptions } from "../options/INestiaTransformOptions";
import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { IRequestQueryValidator } from "../options/IRequestQueryValidator";

export namespace TypedQueryBodyProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.ObjectLiteralExpression => {
    // VALIDATE TYPE
    if (props.context.options.llm) {
      const llm: INestiaTransformOptions.ILlm = props.context.options.llm;
      const result: ValidationPipe<MetadataSchema, MetadataFactory.IError> =
        MetadataFactory.analyze({
          checker: props.context.checker,
          transformer: props.context.transformer,
          options: {
            escape: false,
            constant: true,
            absorb: true,
            validate: (meta, explore) => {
              const errors: string[] = HttpQueryProgrammer.validate(
                meta,
                explore,
                true,
              );
              errors.push(
                ...LlmSchemaProgrammer.validate({
                  config: {
                    strict: llm.strict,
                  },
                  metadata: meta,
                }),
              );
              return errors;
            },
          },
          components: new MetadataStorage(),
          type: props.type,
        });
      if (result.success === false)
        throw TransformerError.from({
          code: props.modulo.getText(),
          errors: result.errors,
        });
    }

    // GENERATE VALIDATION PLAN
    const parameter =
      (key: IRequestQueryValidator<any>["type"]) =>
      (
        programmer: (next: {
          context: ITypiaContext;
          modulo: ts.LeftHandSideExpression;
          type: ts.Type;
          name: string | undefined;
        }) => ts.Expression,
      ) =>
        ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("type"),
            ts.factory.createStringLiteral(key),
          ),
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(key),
            programmer({
              context: {
                ...props.context,
                options: {
                  numeric: false,
                  finite: false,
                  functional: false,
                },
              },
              modulo: props.modulo,
              type: props.type,
              name: undefined,
            }),
          ),
        ]);

    // RETURNS
    const category = props.context.options.validate;
    if (category === "is" || category === "equals")
      return parameter("is")(HttpIsQueryProgrammer.write);
    else if (
      category === "validate" ||
      category === "validateEquals" ||
      category === "validateClone" ||
      category === "validatePrune"
    )
      return parameter("validate")(HttpValidateQueryProgrammer.write);
    return parameter("assert")(HttpAssertQueryProgrammer.write);
  };
}
