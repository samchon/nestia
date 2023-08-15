import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedExceptionProgrammer {
    export const generate =
        ({ checker }: INestiaTransformProject) =>
        (expression: ts.CallExpression): ts.CallExpression => {
            // CHECK GENERIC ARGUMENT EXISTENCE
            if (!expression.typeArguments?.[0]) throw new Error(NOT_SPECIFIED);

            // GET TYPE INFO
            const node: ts.TypeNode = expression.typeArguments[0];
            const type: ts.Type = checker.getTypeFromTypeNode(node);

            if (type.isTypeParameter()) throw new Error(NO_GENERIC_ARGUMENT);

            // CHECK DUPLICATED TRNASFORMATION
            if (expression.arguments.length === 3) return expression;

            // DO TRANSFORM
            const name: string = node.getFullText().trim();
            return ts.factory.updateCallExpression(
                expression,
                expression.expression,
                expression.typeArguments,
                [
                    expression.arguments[0],
                    expression.arguments[1] ??
                        ts.factory.createIdentifier("undefined"),
                    ts.factory.createStringLiteral(name),
                ],
            );
        };
}

const NOT_SPECIFIED =
    "Error on @nestia.core.TypedException(): generic argument is not specified.";
const NO_GENERIC_ARGUMENT =
    "Error on @nestia.core.TypedException(): non-specified generic argument.";
