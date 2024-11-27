import ts from "typescript";
import { HttpAssertQueryProgrammer } from "typia/lib/programmers/http/HttpAssertQueryProgrammer";
import { HttpIsQueryProgrammer } from "typia/lib/programmers/http/HttpIsQueryProgrammer";
import { HttpValidateQueryProgrammer } from "typia/lib/programmers/http/HttpValidateQueryProgrammer";
import { ITypiaContext } from "typia/lib/transformers/ITypiaContext";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { IRequestQueryValidator } from "../options/IRequestQueryValidator";

export namespace TypedQueryBodyProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.ObjectLiteralExpression => {
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
