import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { Metadata } from "typia/lib/metadata/Metadata";
import { MetadataObject } from "typia/lib/metadata/MetadataObject";
import { MetadataProperty } from "typia/lib/metadata/MetadataProperty";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { FunctionImporter } from "typia/lib/programmers/helpers/FunctionImporeter";
import { Atomic } from "typia/lib/typings/Atomic";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedQueryProgrammer {
    export const generate =
        (project: INestiaTransformProject, modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            const object: MetadataObject = getObject(project.checker)(type);
            return decode(project, modulo)(type, object);
        };

    const getObject =
        (checker: ts.TypeChecker) =>
        (type: ts.Type): MetadataObject => {
            const collection: MetadataCollection = new MetadataCollection();
            const metadata: Metadata = MetadataFactory.generate(
                checker,
                collection,
                type,
                {
                    resolve: false,
                    constant: true,
                },
            );
            if (metadata.objects.length !== 1 || metadata.bucket() !== 1)
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "only one object type is allowed.",
                    ),
                );
            else if (metadata.nullable === true)
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "target type T cannot be null.",
                    ),
                );
            else if (metadata.required === false)
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "target type T cannot be undefined.",
                    ),
                );

            const object = metadata.objects[0]!;
            for (const property of object.properties) {
                const key: Metadata = property.key;
                const value: Metadata = property.value;

                if (
                    (value.atomics.length ? 1 : 0) +
                        (value.constants.length ? 1 : 0) +
                        (value.templates.length ? 1 : 0) !==
                    value.bucket()
                )
                    throw new Error(
                        ErrorMessages.property(object)(key)(
                            "only atomic typed propertie are allowed.",
                        ),
                    );
                else if (value.atomics.length > 1 || value.constants.length > 1)
                    throw new Error(
                        ErrorMessages.property(object)(key)(
                            "union type is not allowed.",
                        ),
                    );
                else if (value.nullable === true)
                    throw new Error(
                        ErrorMessages.property(object)(key)(
                            "property type cannot be null. Use undefined instead.",
                        ),
                    );
            }
            return object;
        };

    const decode =
        (project: INestiaTransformProject, modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type, object: MetadataObject): ts.ArrowFunction =>
            ts.factory.createArrowFunction(
                undefined,
                undefined,
                [IdentifierFactory.parameter("input")],
                undefined,
                undefined,
                decode_object(project, modulo)(type, object),
            );

    const decode_object =
        (project: INestiaTransformProject, modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type, object: MetadataObject): ts.ConciseBody => {
            const assert: ts.ArrowFunction = AssertProgrammer.generate(
                {
                    ...project,
                    options: {
                        numeric: true,
                    },
                },
                modulo,
            )(type);
            const output = ts.factory.createIdentifier("output");

            const importer = new FunctionImporter();
            const statements: ts.Statement[] = [
                StatementFactory.constant(
                    "output",
                    ts.factory.createObjectLiteralExpression(
                        object.properties
                            .filter((prop) => (prop.key as any).isSoleLiteral())
                            .map((prop) =>
                                decode_regular_property(importer)(prop),
                            ),
                        true,
                    ),
                ),
                ts.factory.createReturnStatement(
                    ts.factory.createCallExpression(assert, undefined, [
                        output,
                    ]),
                ),
            ];

            return ts.factory.createBlock(
                [...importer.declare(modulo), ...statements],
                true,
            );
        };

    const decode_regular_property =
        (importer: FunctionImporter) =>
        (property: MetadataProperty): ts.PropertyAssignment => {
            const key: string = property.key.constants[0]!.values[0] as string;
            const value: Metadata = property.value;

            const type: Atomic.Literal = value.atomics.length
                ? value.atomics[0]!
                : value.constants.length
                ? value.constants[0]!.type
                : "string";
            return ts.factory.createPropertyAssignment(
                key,
                decode_value(importer)(type)(
                    ts.factory.createCallExpression(
                        ts.factory.createIdentifier("input.get"),
                        undefined,
                        [ts.factory.createStringLiteral(key)],
                    ),
                ),
            );
        };

    const decode_value =
        (importer: FunctionImporter) =>
        (type: Atomic.Literal) =>
        (value: ts.Expression) =>
            ts.factory.createCallExpression(importer.use(type), undefined, [
                value,
            ]);
}

namespace ErrorMessages {
    export const object = (type: Metadata) => (message: string) =>
        `Error on nestia.core.TypedQuery<${type}>(): ${message}`;

    export const property =
        (obj: MetadataObject) => (key: Metadata) => (message: string) =>
            `Error on nestia.core.TypedQuery<${
                obj.name
            }>(): property ${key.getName()} - ${message}`;
}
