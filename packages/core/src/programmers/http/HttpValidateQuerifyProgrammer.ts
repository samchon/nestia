import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { HttpQuerifyProgrammer } from "./HttpQuerifyProgrammer";

export namespace HttpValidateQuerifyProgrammer {
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
                        "validate",
                        ValidateProgrammer.write({
                            ...project,
                            options: {
                                ...project.options,
                                functional: false,
                                numeric: true,
                            },
                        })(modulo)(false)(type, name),
                    ),
                    StatementFactory.constant(
                        "query",
                        HttpQuerifyProgrammer.write({
                            ...project,
                            options: {
                                ...project.options,
                                functional: false,
                                numeric: false,
                            },
                        })(modulo)(type),
                    ),
                    StatementFactory.constant(
                        "output",
                        ts.factory.createCallExpression(
                            ts.factory.createIdentifier("query"),
                            undefined,
                            [ts.factory.createIdentifier("input")],
                        ),
                    ),
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
