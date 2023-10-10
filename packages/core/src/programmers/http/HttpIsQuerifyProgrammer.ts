import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { IsProgrammer } from "typia/lib/programmers/IsProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { HttpQuerifyProgrammer } from "./HttpQuerifyProgrammer";

export namespace HttpIsQuerifyProgrammer {
    export const write =
        (project: IProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.ArrowFunction =>
            ts.factory.createArrowFunction(
                undefined,
                undefined,
                [IdentifierFactory.parameter("input")],
                undefined,
                undefined,
                ts.factory.createBlock([
                    StatementFactory.constant(
                        "is",
                        IsProgrammer.write({
                            ...project,
                            options: {
                                ...project.options,
                                functional: false,
                                numeric: false,
                            },
                        })(modulo)(false)(type),
                    ),
                    StatementFactory.constant(
                        "stringify",
                        HttpQuerifyProgrammer.write({
                            ...project,
                            options: {
                                ...project.options,
                                functional: false,
                                numeric: false,
                            },
                        })(modulo)(type),
                    ),
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
