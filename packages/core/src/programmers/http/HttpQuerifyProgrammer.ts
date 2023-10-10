import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { FunctionImporter } from "typia/lib/programmers/helpers/FunctionImporeter";
import { HttpQueryProgrammer } from "typia/lib/programmers/http/HttpQueryProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";
import { IProject } from "typia/lib/transformers/IProject";
import { TransformerError } from "typia/lib/transformers/TransformerError";

export namespace HttpQuerifyProgrammer {
    export const write =
        (project: IProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.ArrowFunction => {
            // GET OBJECT TYPE
            const importer: FunctionImporter = new FunctionImporter(
                modulo.getText(),
            );
            const collection: MetadataCollection = new MetadataCollection();
            const result = MetadataFactory.analyze(project.checker)({
                escape: false,
                constant: true,
                absorb: true,
                validate: HttpQueryProgrammer.validate,
            })(collection)(type);
            if (result.success === false)
                throw TransformerError.from(
                    `@nestia.core.TypedQuery.${importer.method}`,
                )(result.errors);

            const object: MetadataObject = result.data.objects[0]!;
            return ts.factory.createArrowFunction(
                undefined,
                undefined,
                [IdentifierFactory.parameter("input")],
                undefined,
                undefined,
                ts.factory.createBlock(
                    [
                        ...importer.declare(modulo),
                        StatementFactory.constant(
                            "output",
                            ts.factory.createNewExpression(
                                ts.factory.createIdentifier("URLSearchParams"),
                                undefined,
                                [],
                            ),
                        ),
                        ...object.properties.map((p) =>
                            ts.factory.createExpressionStatement(
                                decode(p.key.constants[0]!.values[0] as string)(
                                    p.value,
                                ),
                            ),
                        ),
                        ts.factory.createReturnStatement(
                            ts.factory.createIdentifier("output"),
                        ),
                    ],
                    true,
                ),
            );
        };

    const decode =
        (key: string) =>
        (value: Metadata): ts.CallExpression =>
            !!value.arrays.length
                ? ts.factory.createCallExpression(
                      IdentifierFactory.access(
                          IdentifierFactory.access(
                              ts.factory.createIdentifier("input"),
                          )(key),
                      )("forEach"),
                      undefined,
                      [
                          ts.factory.createArrowFunction(
                              undefined,
                              undefined,
                              [IdentifierFactory.parameter("elem")],
                              undefined,
                              undefined,
                              append(key)(ts.factory.createIdentifier("elem")),
                          ),
                      ],
                  )
                : append(key)(
                      IdentifierFactory.access(
                          ts.factory.createIdentifier("input"),
                      )(key),
                  );

    const append = (key: string) => (elem: ts.Expression) =>
        ts.factory.createCallExpression(
            IdentifierFactory.access(ts.factory.createIdentifier("output"))(
                "append",
            ),
            undefined,
            [ts.factory.createStringLiteral(key), elem],
        );
}
