import ts from "typescript";

import { JsonMetadataFactory } from "typia/lib/factories/JsonMetadataFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedExceptionProgrammer {
    export const generate =
        ({ checker }: INestiaTransformProject) =>
        (expression: ts.CallExpression): ts.CallExpression => {
            // CHECK GENERIC ARGUMENT EXISTENCE
            if (!expression.typeArguments?.[0])
                throw TransformerError.from("@nestia.core.TypedException")([
                    {
                        name: "uknown",
                        messages: [NOT_SPECIFIED],
                        explore: {
                            top: true,
                            object: null,
                            property: null,
                            nested: null,
                            escaped: false,
                            aliased: false,
                        },
                    },
                ]);

            // GET TYPE INFO
            const node: ts.TypeNode = expression.typeArguments[0];
            const type: ts.Type = checker.getTypeFromTypeNode(node);

            // VALIDATE TYPE
            if (type.isTypeParameter())
                throw TransformerError.from("@nestia.core.TypedException")([
                    {
                        name: TypeFactory.getFullName(checker)(type),
                        messages: [NO_GENERIC_ARGUMENT],
                        explore: {
                            top: true,
                            object: null,
                            property: null,
                            nested: null,
                            escaped: false,
                            aliased: false,
                        },
                    },
                ]);
            JsonMetadataFactory.analyze("@nestia.core.TypedException")(checker)(
                type,
            );

            // CHECK DUPLICATED TRNASFORMATION
            if (expression.arguments.length === 3) return expression;

            // DO TRANSFORM
            const name: string = TypeFactory.getFullName(checker)(type);
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
