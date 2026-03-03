import {
  HttpAssertHeadersProgrammer,
  HttpIsHeadersProgrammer,
  HttpValidateHeadersProgrammer,
  ITypiaContext,
} from "@typia/core";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { IRequestHeadersValidator } from "../options/IRequestHeadersValidator";

export namespace TypedHeadersProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.Expression => {
    // GENERATE VALIDATION PLAN
    const parameter =
      (key: IRequestHeadersValidator<any>["type"]) =>
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
      return parameter("is")(HttpIsHeadersProgrammer.write);
    else if (
      category === "validate" ||
      category === "validateEquals" ||
      category === "validateClone" ||
      category === "validatePrune"
    )
      return parameter("validate")(HttpValidateHeadersProgrammer.write);
    return parameter("assert")(HttpAssertHeadersProgrammer.write);
  };
}
