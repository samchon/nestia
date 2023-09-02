import ts from "typescript";

import { JsonAssertStringifyProgrammer } from "typia/lib/programmers/json/JsonAssertStringifyProgrammer";
import { JsonIsStringifyProgrammer } from "typia/lib/programmers/json/JsonIsStringifyProgrammer";
import { JsonStringifyProgrammer } from "typia/lib/programmers/json/JsonStringifyProgrammer";
import { JsonValidateStringifyProgrammer } from "typia/lib/programmers/json/JsonValidateStringifyProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedRouteProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            // GENERATE STRINGIFY PLAN
            const parameter = (
                key: string,
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
                            options: {}, // use default option
                        })(modulo)(type),
                    ),
                ]);

            // RETURNS
            if (project.options.stringify === "is")
                return parameter("is", JsonIsStringifyProgrammer.write);
            else if (project.options.stringify === "validate")
                return parameter(
                    "validate",
                    JsonValidateStringifyProgrammer.write,
                );
            else if (project.options.stringify === "stringify")
                return parameter("stringify", JsonStringifyProgrammer.write);
            else if (project.options.stringify === null)
                return ts.factory.createNull();

            // ASSERT IS DEFAULT
            return parameter("assert", JsonAssertStringifyProgrammer.write);
        };
}
