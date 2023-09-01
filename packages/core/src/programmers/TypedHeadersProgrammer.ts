import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { FunctionImporter } from "typia/lib/programmers/helpers/FunctionImporeter";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataArray } from "typia/lib/schemas/metadata/MetadataArray";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";
import { MetadataProperty } from "typia/lib/schemas/metadata/MetadataProperty";
import { TransformerError } from "typia/lib/transformers/TransformerError";
import { Atomic } from "typia/lib/typings/Atomic";
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { CoreMetadataUtil } from "./internal/CoreMetadataUtil";

export namespace TypedHeadersProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            const object: MetadataObject = getObject(project.checker)(type);
            return decode(project, modulo)(type, object);
        };

    export const validate = (
        meta: Metadata,
        explore: MetadataFactory.IExplore,
    ): string[] => {
        const errors: string[] = [];
        const insert = (msg: string) => errors.push(msg);

        if (explore.top === true) {
            // TOP MUST BE ONLY OBJECT
            if (meta.objects.length !== 1 || meta.bucket() !== 1)
                insert("only one object type is allowed.");
            if (meta.nullable === true) insert("headers cannot be null.");
            if (meta.isRequired() === false) insert("headers cannot be null.");
        } else if (
            explore.nested !== null &&
            explore.nested instanceof MetadataArray
        ) {
            const atomics = CoreMetadataUtil.atomics(meta);
            const expected: number =
                meta.atomics.length +
                meta.templates.length +
                meta.constants
                    .map((c) => c.values.length)
                    .reduce((a, b) => a + b, 0);
            if (atomics.size > 1) insert("union type is not allowed in array.");
            if (meta.nullable) insert("nullable type is not allowed in array.");
            if (meta.isRequired() === false)
                insert("optional type is not allowed.");
            if (meta.size() !== expected)
                insert("only atomic or constant types are allowed in array.");
        } else if (explore.object && explore.property !== null) {
            //----
            // COMMON
            //----
            // PROPERTY MUST BE SOLE
            if (typeof explore.property === "object")
                insert("dynamic property is not allowed.");
            // DO NOT ALLOW TUPLE TYPE
            if (meta.tuples.length) insert("tuple type is not allowed.");
            // DO NOT ALLOW UNION TYPE
            if (CoreMetadataUtil.isUnion(meta))
                insert("union type is not allowed.");
            // DO NOT ALLOW NESTED OBJECT
            if (
                meta.objects.length ||
                meta.sets.length ||
                meta.maps.length ||
                meta.natives.length
            )
                insert("nested object type is not allowed.");
            // DO NOT ALLOW NULLABLE
            if (meta.nullable) insert("nullable type is not allowed.");

            //----
            // ARRAY CASES
            //----
            const isArray: boolean = meta.arrays.length > 1;
            // ARRAY TYPE MUST BE REQUIRED
            if (isArray && meta.isRequired() === false)
                insert("optional type is not allowed when array.");
            // SET-COOKIE MUST BE ARRAY
            if (explore.property === "set-cookie" && !isArray)
                insert("set-cookie property must be array.");
            // MUST BE SINGULAR CASE
            if (
                typeof explore.property === "string" &&
                SINGULAR.has(explore.property) &&
                isArray
            )
                insert("property cannot be array.");
        }
        return errors;
    };

    const getObject =
        (checker: ts.TypeChecker) =>
        (type: ts.Type): MetadataObject => {
            const collection: MetadataCollection = new MetadataCollection();
            const result = MetadataFactory.analyze(checker)({
                escape: false,
                constant: true,
                absorb: true,
                validate,
            })(collection)(type);
            if (result.success === false)
                throw TransformerError.from("@core.nestia.TypedHeaders")(
                    result.errors,
                );
            return result.data.objects[0]!;
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

            const importer: FunctionImporter = new FunctionImporter(
                "TypedHeaders",
            );
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
                ? [value.atomics[0].type, false]
                : value.constants.length
                ? [value.constants[0]!.type, false]
                : (() => {
                      const meta =
                          value.arrays[0]?.type.value ??
                          value.tuples[0].type.elements[0];
                      return meta.atomics.length
                          ? [meta.atomics[0].type, true]
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
                        : decode_array(importer)(type)(key)(value)(accessor)
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

    const decode_array =
        (importer: FunctionImporter) =>
        (type: Atomic.Literal) =>
        (key: string) =>
        (value: Metadata) =>
        (accessor: ts.Expression) => {
            const expression = ts.factory.createCallChain(
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
                    ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                    ts.factory.createIdentifier("map"),
                ),
                undefined,
                undefined,
                [importer.use(type)],
            );
            if (value.isRequired() === false) return expression;
            return ts.factory.createBinaryExpression(
                expression,
                ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                ts.factory.createArrayLiteralExpression([], false),
            );
        };
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
