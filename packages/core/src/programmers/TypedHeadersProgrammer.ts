import ts from "typescript";

import { HttpAssertHeadersProgrammer } from "typia/lib/programmers/http/HttpAssertHeadersProgrammer";
import { HttpIsHeadersProgrammer } from "typia/lib/programmers/http/HttpIsHeadersProgrammer";
import { HttpValidateHeadersProgrammer } from "typia/lib/programmers/http/HttpValidateHeadersProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { IRequestHeadersValidator } from "../options/IRequestHeadersValidator";

export namespace TypedHeadersProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            // GENERATE VALIDATION PLAN
            const parameter =
                (key: IRequestHeadersValidator<any>["type"]) =>
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
                return parameter("is")(HttpIsHeadersProgrammer.write);
            else if (
                category === "validate" ||
                category === "validateEquals" ||
                category === "validateClone" ||
                category === "validatePrune"
            )
                return parameter("validate")(
                    HttpValidateHeadersProgrammer.write,
                );
            return parameter("assert")(HttpAssertHeadersProgrammer.write);
        };
}
