import {
  ITypiaContext,
  IdentifierFactory,
  IsProgrammer,
  StatementFactory,
} from "@typia/core";
import ts from "typescript";

import { HttpQuerifyProgrammer } from "./HttpQuerifyProgrammer";

export namespace HttpIsQuerifyProgrammer {
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
          name: "is",
          value: IsProgrammer.write({
            config: {
              equals: false,
            },
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
            name: undefined,
          }),
        }),
        StatementFactory.constant({
          name: "stringify",
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
        ts.factory.createReturnStatement(
          ts.factory.createConditionalExpression(
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("is"),
              undefined,
              [ts.factory.createIdentifier("input")],
            ),
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("stringify"),
              undefined,
              [ts.factory.createIdentifier("input")],
            ),
            undefined,
            ts.factory.createNull(),
          ),
        ),
      ]),
    );
}
