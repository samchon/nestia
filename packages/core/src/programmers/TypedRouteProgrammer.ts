import ts from "typescript";

import { AssertStringifyProgrammer } from "typia/lib/programmers/AssertStringifyProgrammer";
import { IsStringifyProgrammer } from "typia/lib/programmers/IsStringifyProgrammer";
import { StringifyProgrammer } from "typia/lib/programmers/StringifyProgrammer";
import { ValidateStringifyProgrammer } from "typia/lib/programmers/ValidateStringifyProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedRouteProgrammer {
    export const generate =
        (project: INestiaTransformProject, modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            // GENERATE STRINGIFY PLAN
            const parameter = (
                key: string,
                programmer: (
                    project: IProject,
                    modulo: ts.LeftHandSideExpression,
                ) => (type: ts.Type) => ts.ArrowFunction,
            ) =>
                ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("type"),
                        ts.factory.createStringLiteral(key),
                    ),
                    ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier(key),
                        programmer(
                            {
                                ...project,
                                options: {}, // use default option
                            },
                            modulo,
                        )(type),
                    ),
                ]);

            // RETURNS
            if (project.options.stringify === "stringify")
                return parameter("stringify", StringifyProgrammer.generate);
            else if (project.options.stringify === "assert")
                return parameter("assert", AssertStringifyProgrammer.generate);
            else if (project.options.stringify === "validate")
                return parameter(
                    "validate",
                    ValidateStringifyProgrammer.generate,
                );
            else if (project.options.stringify === null)
                return ts.factory.createNull();
            return parameter("is", IsStringifyProgrammer.generate);
        };
}
