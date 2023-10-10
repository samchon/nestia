import ts from "typescript";

import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { HttpAssertQuerifyProgrammer } from "./http/HttpAssertQuerifyProgrammer";
import { HttpIsQuerifyProgrammer } from "./http/HttpIsQuerifyProgrammer";
import { HttpQuerifyProgrammer } from "./http/HttpQuerifyProgrammer";
import { HttpValidateQuerifyProgrammer } from "./http/HttpValidateQuerifyProgrammer";

export namespace TypedQueryRouteProgrammer {
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
                return parameter("is", HttpIsQuerifyProgrammer.write);
            else if (project.options.stringify === "validate")
                return parameter(
                    "validate",
                    HttpValidateQuerifyProgrammer.write,
                );
            else if (project.options.stringify === "stringify")
                return parameter("stringify", HttpQuerifyProgrammer.write);
            else if (project.options.stringify === null)
                return ts.factory.createNull();

            // ASSERT IS DEFAULT
            return parameter("assert", HttpAssertQuerifyProgrammer.write);
        };
}
