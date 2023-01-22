import ts from "typescript";

import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { IsProgrammer } from "typia/lib/programmers/IsProgrammer";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedBodyProgrammer {
    export const generate =
        (project: INestiaTransformProject, modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.ObjectLiteralExpression => {
            // GENERATE VALIDATION PLAN
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
                                options: {
                                    numeric: false,
                                    finite: false,
                                    functional: false,
                                },
                            },
                            modulo,
                        )(type),
                    ),
                ]);

            // RETURNS
            if (project.options.validate === "is")
                return parameter("is", IsProgrammer.generate);
            else if (project.options.validate === "validate")
                return parameter("validate", ValidateProgrammer.generate);
            return parameter("assert", AssertProgrammer.generate);
        };
}
