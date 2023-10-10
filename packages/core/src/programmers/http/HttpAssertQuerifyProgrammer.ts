import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { HttpQuerifyProgrammer } from "./HttpQuerifyProgrammer";

export namespace HttpAssertQuerifyProgrammer {
    export const write =
        (project: IProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type, name?: string): ts.ArrowFunction =>
            ts.factory.createArrowFunction(
                undefined,
                undefined,
                [IdentifierFactory.parameter("input")],
                undefined,
                undefined,
                ts.factory.createBlock([
                    StatementFactory.constant(
                        "assert",
                        AssertProgrammer.write({
                            ...project,
                            options: {
                                ...project.options,
                                functional: false,
                                numeric: false,
                            },
                        })(modulo)(false)(type, name),
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
