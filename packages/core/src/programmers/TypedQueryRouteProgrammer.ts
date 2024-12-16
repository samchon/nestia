import ts from "typescript";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { HttpQueryProgrammer } from "typia/lib/programmers/http/HttpQueryProgrammer";
import { LlmSchemaProgrammer } from "typia/lib/programmers/llm/LlmSchemaProgrammer";
import { ITypiaContext } from "typia/lib/transformers/ITypiaContext";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { HttpAssertQuerifyProgrammer } from "./http/HttpAssertQuerifyProgrammer";
import { HttpIsQuerifyProgrammer } from "./http/HttpIsQuerifyProgrammer";
import { HttpQuerifyProgrammer } from "./http/HttpQuerifyProgrammer";
import { HttpValidateQuerifyProgrammer } from "./http/HttpValidateQuerifyProgrammer";
import { LlmValidatePredicator } from "./internal/LlmValidatePredicator";

export namespace TypedQueryRouteProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.Expression => {
    // VALIDATE TYPE
    if (LlmValidatePredicator.is(props.context.options.llm)) {
      const result = MetadataFactory.analyze({
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
                model: props.context.options.llm!.model,
                config: {
                  strict: props.context.options.llm!.strict,
                  recursive: props.context.options.llm!.recursive,
                },
              })(meta),
            );
            return errors;
          },
        },
        collection: new MetadataCollection(),
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
