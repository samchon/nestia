import ts from "typescript";
import { ITypiaContext } from "typia/lib/transformers/ITypiaContext";

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
