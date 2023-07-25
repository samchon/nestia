import ts from "typescript";

import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/metadata/Metadata";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace PlainBodyProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): readonly ts.Expression[] => {
            validate(
                MetadataFactory.analyze(project.checker)({
                    resolve: false,
                    constant: true,
                    absorb: true,
                })(new MetadataCollection())(type),
            );
            return [
                AssertProgrammer.write({
                    ...project,
                    options: {
                        numeric: false,
                        finite: false,
                        functional: false,
                    },
                })(modulo)(false)(type),
            ];
        };
}

const validate = (metadata: Metadata): void => {
    const expected: number =
        (metadata.atomics.some((t) => t === "string") ? 1 : 0) +
        metadata.templates.length +
        metadata.constants
            .filter((c) => c.type === "string")
            .map((c) => c.values.length)
            .reduce((a, b) => a + b, 0);
    if (expected === 0 || expected !== metadata.size())
        throw error(`only string type is allowed`);
    else if (metadata.isRequired() === false)
        throw error(`do not allow undefindable type`);
    else if (metadata.nullable === true)
        throw error(`do not allow nullable type`);
    else if (metadata.any === true) throw error(`do not allow any type`);
};

const error = (msg: string) =>
    new Error(`Error on nestia.core.PlainBody(): ${msg}.`);
