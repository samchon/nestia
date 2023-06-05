import ts from "typescript";

import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { IsProgrammer } from "typia/lib/programmers/IsProgrammer";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { IRequestBodyValidator } from "../options/IRequestBodyValidator";

export namespace TypedBodyProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.ObjectLiteralExpression => {
            // GENERATE VALIDATION PLAN
            const parameter =
                (key: IRequestBodyValidator<any>["type"]) =>
                (equals: boolean) =>
                (
                    programmer: (
                        project: IProject,
                    ) => (
                        modulo: ts.LeftHandSideExpression,
                    ) => (
                        equals: boolean,
                    ) => (type: ts.Type) => ts.ArrowFunction,
                ) =>
                    ts.factory.createObjectLiteralExpression([
                        ts.factory.createPropertyAssignment(
                            ts.factory.createIdentifier("type"),
                            ts.factory.createStringLiteral(key),
                        ),
                        ts.factory.createPropertyAssignment(
                            ts.factory.createIdentifier(key),
                            programmer({
                                ...project,
                                options: {
                                    numeric: false,
                                    finite: false,
                                    functional: false,
                                },
                            })(modulo)(equals)(type),
                        ),
                    ]);

            // RETURNS
            const category = project.options.validate;
            if (category === "is")
                return parameter("is")(false)(IsProgrammer.write);
            else if (category === "validate")
                return parameter("validate")(false)(ValidateProgrammer.write);
            else if (category === "validateEquals")
                return parameter("validate")(true)(AssertProgrammer.write);
            else if (category === "equals")
                return parameter("is")(true)(AssertProgrammer.write);
            else if (category === "assertEquals")
                return parameter("assert")(true)(AssertProgrammer.write);
            return parameter("assert")(false)(AssertProgrammer.write);
        };
}
