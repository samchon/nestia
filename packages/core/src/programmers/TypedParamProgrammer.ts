import ts from "typescript";

import { HttpParameterProgrammer } from "typia/lib/programmers/http/HttpParameterProgrammer";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedParamProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (parameters: readonly ts.Expression[]) =>
        (type: ts.Type): readonly ts.Expression[] => {
            // ALREADY BEING TRANSFORMED
            if (parameters.length !== 1) return parameters;
            return [
                parameters[0],
                HttpParameterProgrammer.write({
                    ...project,
                    options: {
                        numeric: true,
                    },
                })(modulo)(type),
            ];
        };
}
