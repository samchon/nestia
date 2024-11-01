import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { ITypiaContext } from "typia/lib/transformers/ITypiaContext";

import { HttpQuerifyProgrammer } from "./HttpQuerifyProgrammer";

export namespace HttpValidateQuerifyProgrammer {
  export const write = (props: {
    context: ITypiaContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.ArrowFunction =>
    ts.factory.createArrowFunction(
      undefined,
      undefined,
      [IdentifierFactory.parameter("input")],
      undefined,
      undefined,
      ts.factory.createBlock([
        StatementFactory.constant({
          name: "validate",
          value: ValidateProgrammer.write({
            config: {
              equals: false,
            },
            context: {
              ...props.context,
              options: {
                ...props.context.options,
                functional: false,
                numeric: true,
              },
            },
            modulo: props.modulo,
            type: props.type,
            name: undefined,
          }),
        }),
        StatementFactory.constant({
          name: "query",
          value: HttpQuerifyProgrammer.write({
            context: {
              ...props.context,
              options: {
                ...props.context.options,
                functional: false,
                numeric: false,
              },
            },
            modulo: props.modulo,
            type: props.type,
          }),
        }),
        StatementFactory.constant({
          name: "output",
          value: ts.factory.createCallExpression(
            ts.factory.createIdentifier("query"),
            undefined,
            [ts.factory.createIdentifier("input")],
          ),
        }),
        ts.factory.createReturnStatement(
          ts.factory.createAsExpression(
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("validate"),
              undefined,
              [ts.factory.createIdentifier("output")],
            ),
            ts.factory.createTypeReferenceNode("any"),
          ),
        ),
      ]),
    );
}
