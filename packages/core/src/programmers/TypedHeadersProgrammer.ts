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
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedHeadersProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            const object: MetadataObject = getObject(project.checker)(type);
            return decode(project, modulo)(type, object);
        };

    const getObject =
        (checker: ts.TypeChecker) =>
        (type: ts.Type): MetadataObject => {
            const collection: MetadataCollection = new MetadataCollection();
            const metadata: Metadata = MetadataFactory.analyze(checker)({
                resolve: false,
                constant: true,
                absorb: true,
            })(collection)(type);
            if (metadata.objects.length !== 1 || metadata.bucket() !== 1)
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "only one object type is allowed.",
                    ),
                );
            else if (metadata.nullable === true)
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "query parameter cannot be null.",
                    ),
                );
            else if (metadata.isRequired() === false)
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "query parameter cannot be undefined.",
                    ),
                );

            const object: MetadataObject = metadata.objects[0]!;
            if (object.properties.some((p) => !(p.key as any).isSoleLiteral()))
                throw new Error(
                    ErrorMessages.object(metadata)(
                        "dynamic property is not allowed.",
                    ),
                );

            for (const property of object.properties) {
                const key: string = property.key.constants[0]
                    .values[0] as string;
                const value: Metadata = property.value;
                validate(object)(key)(value, 0);
            }
            return object;
        };

    const validate =
        (obj: MetadataObject) =>
        (key: string) =>
        (value: Metadata, depth: number): string[] => {
            if (depth === 1 && value.isRequired() === false)
                throw new Error(
                    ErrorMessages.property(obj)(key)(
                        "optional type is not allowed in array.",
                    ),
                );
            else if (value.nullable === true)
                throw new Error(
                    ErrorMessages.property(obj)(key)(
                        "nullable type is not allowed.",
                    ),
                );
            else if (
                value.maps.length ||
                value.sets.length ||
                value.objects.length
            )
                throw new Error(
                    ErrorMessages.property(obj)(key)(
                        "object type is not allowed",
                    ),
                );

            const atom: string[] = [];
            for (const type of value.atomics) atom.push(type);
            for (const { type } of value.constants) atom.push(type);

            if (depth === 0 && (value.arrays.length || value.arrays.length)) {
                if (atom.length)
                    throw new Error(
                        ErrorMessages.property(obj)(key)(
                            "union type is not allowed",
                        ),
                    );
                for (const array of value.arrays)
                    atom.push(...validate(obj)(key)(array.value, depth + 1));
                for (const tuple of value.tuples)
                    for (const elem of tuple.elements)
                        atom.push(...validate(obj)(key)(elem, depth + 1));
            } else if (value.arrays.length || value.tuples.length)
                throw new Error(
                    ErrorMessages.property(obj)(key)(
                        "double-array type is not allowed",
                    ),
                );

            const size: number = new Set(atom).size;
            if (size === 0)
                throw new Error(
                    ErrorMessages.property(obj)(key)("unknown type"),
                );
            else if (size > 1)
                throw new Error(
                    ErrorMessages.property(obj)(key)(
                        "union type is not allowed",
                    ),
                );
            return atom;
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
            const assert: ts.ArrowFunction = AssertProgrammer.write({
                ...project,
                options: {
                    numeric: true,
                    finite: true,
                },
            })(modulo)(false)(type);
            const output: ts.Identifier = ts.factory.createIdentifier("output");

            const importer: FunctionImporter = new FunctionImporter();
            const statements: ts.Statement[] = [
                StatementFactory.constant(
                    "output",
                    ts.factory.createObjectLiteralExpression(
                        object.properties.map((prop) =>
                            decode_regular_property(importer)(object)(prop),
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
        (object: MetadataObject) =>
        (property: MetadataProperty): ts.PropertyAssignment => {
            const key: string = property.key.constants[0]!.values[0] as string;
            const value: Metadata = property.value;

            const [type, isArray]: [Atomic.Literal, boolean] = value.atomics
                .length
                ? [value.atomics[0], false]
                : value.constants.length
                ? [value.constants[0]!.type, false]
                : (() => {
                      const meta =
                          value.arrays[0]?.value ?? value.tuples[0].elements[0];
                      return meta.atomics.length
                          ? [meta.atomics[0], true]
                          : [meta.constants[0]!.type, true];
                  })();
            if (isArray && SINGULAR.has(key))
                throw new Error(
                    ErrorMessages.property(object)(key)(
                        `property "${key}" cannot be array.`,
                    ),
                );
            else if (!isArray && key === "set-cookie")
                throw new Error(
                    ErrorMessages.property(object)(key)(
                        `property "${key}" must be array.`,
                    ),
                );

            const accessor = IdentifierFactory.access(
                ts.factory.createIdentifier("input"),
            )(key.toLowerCase());

            return ts.factory.createPropertyAssignment(
                Escaper.variable(key)
                    ? key
                    : ts.factory.createStringLiteral(key),
                isArray
                    ? key === "set-cookie"
                        ? accessor
                        : ts.factory.createCallChain(
                              ts.factory.createPropertyAccessChain(
                                  ts.factory.createCallChain(
                                      ts.factory.createPropertyAccessChain(
                                          accessor,
                                          ts.factory.createToken(
                                              ts.SyntaxKind.QuestionDotToken,
                                          ),
                                          ts.factory.createIdentifier("split"),
                                      ),
                                      undefined,
                                      undefined,
                                      [
                                          ts.factory.createStringLiteral(
                                              key === "cookie" ? "; " : ", ",
                                          ),
                                      ],
                                  ),
                                  ts.factory.createToken(
                                      ts.SyntaxKind.QuestionDotToken,
                                  ),
                                  ts.factory.createIdentifier("map"),
                              ),
                              undefined,
                              undefined,
                              [importer.use(type)],
                          )
                    : decode_value(importer)(type)(accessor),
            );
        };

    const decode_value =
        (importer: FunctionImporter) =>
        (type: Atomic.Literal) =>
        (value: ts.Expression) =>
            type === "string"
                ? value
                : ts.factory.createCallExpression(
                      importer.use(type),
                      undefined,
                      [value],
                  );
}

namespace ErrorMessages {
    export const object = (type: Metadata) => (message: string) =>
        `Error on nestia.core.TypedHeaders<${type.getName()}>(): ${message}`;

    export const property =
        (obj: MetadataObject) => (key: string) => (message: string) =>
            `Error on nestia.core.TypedHeaders<${obj.name}>(): property "${key}" - ${message}`;
}

const SINGULAR: Set<string> = new Set([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "server",
    "user-agent",
]);
