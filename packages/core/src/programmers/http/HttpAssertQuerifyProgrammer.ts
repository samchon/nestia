import {
  AssertProgrammer,
  ITypiaContext,
  IdentifierFactory,
  StatementFactory,
} from "@typia/core";
import ts from "typescript";

import { HttpQuerifyProgrammer } from "./HttpQuerifyProgrammer";

export namespace HttpAssertQuerifyProgrammer {
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
          name: "assert",
          value: AssertProgrammer.write({
            context: {
              ...props.context,
              options: {
                ...props.context.options,
                functional: false,
                numeric: false,
              },
            },
            modulo: props.modulo,
            config: {
              equals: false,
              guard: false,
            },
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
          ts.factory.createCallExpression(
            ts.factory.createIdentifier("stringify"),
            undefined,
            [
              ts.factory.createCallExpression(
                ts.factory.createIdentifier("assert"),
                undefined,
                [ts.factory.createIdentifier("input")],
              ),
            ],
          ),
        ),
      ]),
    );
}
