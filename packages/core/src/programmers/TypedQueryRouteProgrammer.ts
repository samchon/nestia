import {
  HttpQueryProgrammer,
  ITypiaContext,
  LlmParametersProgrammer,
  MetadataCollection,
  MetadataFactory,
  MetadataSchema,
  TransformerError,
} from "@typia/core";
import { ValidationPipe } from "@typia/interface";
import ts from "typescript";

import { INestiaTransformOptions } from "../options/INestiaTransformOptions";
import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { HttpAssertQuerifyProgrammer } from "./http/HttpAssertQuerifyProgrammer";
import { HttpIsQuerifyProgrammer } from "./http/HttpIsQuerifyProgrammer";
import { HttpQuerifyProgrammer } from "./http/HttpQuerifyProgrammer";
import { HttpValidateQuerifyProgrammer } from "./http/HttpValidateQuerifyProgrammer";

export namespace TypedQueryRouteProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.Expression => {
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
            validate: (next) => {
              const errors: string[] = HttpQueryProgrammer.validate({
                metadata: next.metadata,
                explore: next.explore,
                allowOptional: true,
              });
              if (next.metadata.size() !== 0)
                errors.push(
                  ...LlmParametersProgrammer.validate({
                    config: {
                      strict: llm.strict ?? false,
                    },
                    metadata: next.metadata,
                    explore: next.explore,
                  }),
                );
              return errors;
            },
          },
          components: new MetadataCollection(),
          type: props.type,
        });
      if (result.success === false)
        throw TransformerError.from({
          code: props.modulo.getText(),
          errors: result.errors,
        });
    }

    // GENERATE STRINGIFY PLAN
    const parameter = (
      key: string,
      programmer: (next: {
        context: ITypiaContext;
        modulo: ts.LeftHandSideExpression;
        type: ts.Type;
      }) => ts.ArrowFunction,
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
              options: {}, // use default option
            },
            modulo: props.modulo,
            type: props.type,
          }),
        ),
      ]);

    // RETURNS
    if (props.context.options.stringify === "is")
      return parameter("is", HttpIsQuerifyProgrammer.write);
    else if (props.context.options.stringify === "validate")
      return parameter("validate", HttpValidateQuerifyProgrammer.write);
    else if (props.context.options.stringify === "stringify")
      return parameter("stringify", HttpQuerifyProgrammer.write);
    else if (props.context.options.stringify === null)
      return ts.factory.createNull();

    // ASSERT IS DEFAULT
    return parameter("assert", HttpAssertQuerifyProgrammer.write);
  };
}
