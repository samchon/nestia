import ts from "typescript";

import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace PlainBodyProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.Expression => {
            const result = MetadataFactory.analyze(project.checker)({
                escape: false,
                constant: true,
                absorb: true,
                validate,
            })(new MetadataCollection())(type);
            if (result.success === false)
                throw TransformerError.from("@core.nestia.TypedParam")(
                    result.errors,
                );
            return AssertProgrammer.write({
                ...project,
                options: {
                    numeric: false,
                    finite: false,
                    functional: false,
                },
            })(modulo)(false)(type);
        };
}

const validate = (metadata: Metadata): string[] => {
    const errors: string[] = [];
    const insert = (msg: string) => errors.push(msg);

    const expected: number =
        (metadata.atomics.some((a) => a.type === "string") ? 1 : 0) +
        metadata.templates.length +
        metadata.constants
            .filter((c) => c.type === "string")
            .map((c) => c.values.length)
            .reduce((a, b) => a + b, 0);
    if (expected === 0 || expected !== metadata.size())
        insert(`only string type is allowed`);
    if (metadata.isRequired() === false)
        insert(`do not allow undefindable type`);
    if (metadata.nullable === true) insert(`do not allow nullable type`);
    else if (metadata.any === true) insert(`do not allow any type`);

    return errors;
};
