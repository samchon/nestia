import ts from "typescript";

import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/metadata/Metadata";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedParamProgrammer {
    export const generate =
        ({ checker }: INestiaTransformProject) =>
        (parameters: readonly ts.Expression[]) =>
        (type: ts.Type): readonly ts.Expression[] => {
            const metadata: Metadata = MetadataFactory.analyze(checker)({
                resolve: false,
                constant: true,
                absorb: true,
            })(new MetadataCollection())(type);
            validate(metadata);
            const [atomic] = get_atomic_types(metadata);

            // AUTO TYPE SPECIFICATION
            if (parameters.length === 1)
                return [
                    parameters[0],
                    ts.factory.createStringLiteral(atomic),
                    metadata.nullable
                        ? ts.factory.createTrue()
                        : ts.factory.createFalse(),
                ];

            // TYPE HAS BEEN SPECIFIED IN DECORATOR
            const specified: Metadata = MetadataFactory.analyze(checker)({
                resolve: false,
                constant: true,
                absorb: true,
            })(new MetadataCollection())(
                checker.getTypeAtLocation(parameters[1]),
            );
            if (equals(atomic, specified) === false)
                throw error("different type between parameter and variable");

            if (parameters.length === 2)
                return [
                    parameters[0],
                    parameters[1],
                    metadata.nullable
                        ? ts.factory.createTrue()
                        : ts.factory.createFalse(),
                ];

            // NULLABLE HAS BEEN SPECIFIED
            const nullable: Metadata = MetadataFactory.analyze(checker)({
                resolve: false,
                constant: true,
                absorb: true,
            })(new MetadataCollection())(
                checker.getTypeAtLocation(parameters[2]),
            );
            if (nullable.getName() !== "true" && nullable.getName() !== "false")
                throw error("nullable value must be literal type");
            else if (metadata.nullable !== (nullable.getName() === "true"))
                throw error(
                    "different type (nullable) between parameter and variable",
                );
            return parameters;
        };
}

const validate = (meta: Metadata) => {
    if (meta.any) throw error("do not allow any type");
    else if (meta.isRequired() === false)
        throw error("do not allow undefindable type");

    const atomics: string[] = get_atomic_types(meta);
    const expected: number =
        meta.atomics.length +
        meta.templates.length +
        meta.constants.map((c) => c.values.length).reduce((a, b) => a + b, 0);
    if (meta.size() !== expected || atomics.length === 0)
        throw error("only atomic or constant types is allowed");
    else if (atomics.length > 1) throw error("do not allow union type");
};

const get_atomic_types = (meta: Metadata): string[] => [
    ...new Set([
        ...meta.atomics,
        ...meta.constants.map((c) => c.type),
        ...(meta.templates.length ? ["string"] : []),
    ]),
];

const error = (message: string) =>
    new Error(`Error on nestia.core.TypedParam(): ${message}.`);

const equals = (atomic: string, p: Metadata) => {
    const name: string = p.getName();
    if (atomic === "string")
        return name === `"string"` || name === `"uuid"` || name === `"date"`;
    return `"${atomic}"` === name;
};
