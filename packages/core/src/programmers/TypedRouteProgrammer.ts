import ts from "typescript";
import { JsonMetadataFactory } from "typia/lib/factories/JsonMetadataFactory";
import { JsonAssertStringifyProgrammer } from "typia/lib/programmers/json/JsonAssertStringifyProgrammer";
import { JsonIsStringifyProgrammer } from "typia/lib/programmers/json/JsonIsStringifyProgrammer";
import { JsonStringifyProgrammer } from "typia/lib/programmers/json/JsonStringifyProgrammer";
import { JsonValidateStringifyProgrammer } from "typia/lib/programmers/json/JsonValidateStringifyProgrammer";
import { LlmSchemaProgrammer } from "typia/lib/programmers/llm/LlmSchemaProgrammer";
import { IProgrammerProps } from "typia/lib/transformers/IProgrammerProps";

import { INestiaTransformContext } from "../options/INestiaTransformProject";

export namespace TypedRouteProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.Expression => {
    // VALIDATE TYPE
    if (props.context.options.llm)
      JsonMetadataFactory.analyze({
        method: "@nestia.core.TypedRoute",
        checker: props.context.checker,
        transformer: props.context.transformer,
        type: props.type,
        validate: (metadata) =>
          LlmSchemaProgrammer.validate({
            config: {
              strict: props.context.options.llm?.strict,
            },
            metadata,
          }),
      });

    // GENERATE STRINGIFY PLAN
    const parameter = (next: {
      type: string;
      key: string;
      programmer: (next: IProgrammerProps) => ts.Expression;
    }) =>
      ts.factory.createObjectLiteralExpression([
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier("type"),
          ts.factory.createStringLiteral(next.type),
        ),
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier(next.key),
          next.programmer({
            context: {
              ...props.context,
              options: {}, // use default option
            },
            modulo: props.modulo,
            type: props.type,
            name: undefined,
          }),
        ),
      ]);

    // RETURNS
    if (props.context.options.stringify === "is")
      return parameter({
        type: "is",
        key: "is",
        programmer: JsonIsStringifyProgrammer.write,
      });
    else if (props.context.options.stringify === "validate")
      return parameter({
        type: "validate",
        key: "validate",
        programmer: JsonValidateStringifyProgrammer.write,
      });
    else if (props.context.options.stringify === "stringify")
      return parameter({
        type: "stringify",
        key: "stringify",
        programmer: JsonStringifyProgrammer.write,
      });
    else if (props.context.options.stringify === "validate.log")
      return parameter({
        type: "validate.log",
        key: "validate",
        programmer: JsonValidateStringifyProgrammer.write,
      });
    else if (props.context.options.stringify === null)
      return ts.factory.createNull();

    // ASSERT IS DEFAULT
    return parameter({
      type: "assert",
      key: "assert",
      programmer: JsonAssertStringifyProgrammer.write,
    });
  };
}
