import ts from "typescript";

import { HttpAssertQueryProgrammer } from "typia/lib/programmers/http/HttpAssertQueryProgrammer";
import { HttpIsQueryProgrammer } from "typia/lib/programmers/http/HttpIsQueryProgrammer";
import { HttpValidateQueryProgrammer } from "typia/lib/programmers/http/HttpValidateQueryProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { IRequestQueryValidator } from "../options/IRequestQueryValidator";

export namespace TypedQueryProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            // GENERATE VALIDATION PLAN
            const parameter =
                (key: IRequestQueryValidator<any>["type"]) =>
                (
                    programmer: (
                        project: IProject,
                    ) => (
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
                            programmer({
                                ...project,
                                options: {
                                    numeric: false,
                                    finite: false,
                                    functional: false,
                                },
                            })(modulo)(type),
                        ),
                    ]);

            // RETURNS
            const category = project.options.validate;
            if (category === "is" || category === "equals")
                return parameter("is")(HttpIsQueryProgrammer.write);
            else if (
                category === "validate" ||
                category === "validateEquals" ||
                category === "validateClone" ||
                category === "validatePrune"
            )
                return parameter("validate")(HttpValidateQueryProgrammer.write);
            return parameter("assert")(HttpAssertQueryProgrammer.write);
        };
}
