import ts from "typescript";

import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IsProgrammer } from "typia/lib/programmers/IsProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { CoreMetadataUtil } from "./internal/CoreMetadataUtil";

export namespace TypedParamProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (parameters: readonly ts.Expression[]) =>
        (type: ts.Type): readonly ts.Expression[] => {
            // ALREADY BEING TRANSFORMED
            if (parameters.length !== 1) return parameters;

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
            const [atomic] = [...CoreMetadataUtil.atomics(result.data)];
            const name: string = result.data.getName();
            const is: ts.ArrowFunction = IsProgrammer.write({
                ...project,
                options: {
                    numeric: true,
                },
            })(modulo)(false)(type);
            const cast: ts.ArrowFunction = CASTERS[atomic](
                result.data.nullable,
            );
            return [
                parameters[0],
                ts.factory.createObjectLiteralExpression(
                    [
                        ts.factory.createPropertyAssignment(
                            "name",
                            ts.factory.createStringLiteral(name),
                        ),
                        ts.factory.createPropertyAssignment("is", is),
                        ts.factory.createPropertyAssignment("cast", cast),
                    ],
                    true,
                ),
            ];
        };

    export const validate = (meta: Metadata): string[] => {
        const errors: string[] = [];
        const insert = (msg: string) => errors.push(msg);

        if (meta.any) insert("do not allow any type");
        if (meta.isRequired() === false)
            insert("do not allow undefindable type");

        const atomics = CoreMetadataUtil.atomics(meta);
        const expected: number =
            meta.atomics.length +
            meta.templates.length +
            meta.constants
                .map((c) => c.values.length)
                .reduce((a, b) => a + b, 0);
        if (meta.size() !== expected || atomics.size === 0)
            insert("only atomic or constant types are allowed");
        if (atomics.size > 1) insert("do not allow union type");

        return errors;
    };
}

const CASTERS = {
    boolean: (nullable: boolean) =>
        createArrow(nullable)(
            ts.factory.createConditionalExpression(
                ts.factory.createLogicalOr(
                    ts.factory.createStrictEquality(
                        ts.factory.createStringLiteral("false"),
                        ts.factory.createIdentifier("str"),
                    ),
                    ts.factory.createStrictEquality(
                        ts.factory.createStringLiteral("0"),
                        ts.factory.createIdentifier("str"),
                    ),
                ),
                undefined,
                ts.factory.createFalse(),
                undefined,
                ts.factory.createConditionalExpression(
                    ts.factory.createLogicalOr(
                        ts.factory.createStrictEquality(
                            ts.factory.createStringLiteral("true"),
                            ts.factory.createIdentifier("str"),
                        ),
                        ts.factory.createStrictEquality(
                            ts.factory.createStringLiteral("1"),
                            ts.factory.createIdentifier("str"),
                        ),
                    ),
                    undefined,
                    ts.factory.createTrue(),
                    undefined,
                    ts.factory.createIdentifier("str"),
                ),
            ),
        ),
    number: (nullable: boolean) =>
        createArrow(nullable)(
            ts.factory.createCallExpression(
                ts.factory.createIdentifier("Number"),
                undefined,
                [ts.factory.createIdentifier("str")],
            ),
        ),
    bigint: (nullable: boolean) =>
        createArrow(nullable)(
            ts.factory.createCallExpression(
                ts.factory.createIdentifier("BigInt"),
                undefined,
                [ts.factory.createIdentifier("str")],
            ),
        ),
    string: (nullable: boolean) =>
        createArrow(nullable)(ts.factory.createIdentifier("str")),
};

const createArrow = (nullable: boolean) => (expr: ts.Expression) =>
    ts.factory.createArrowFunction(
        undefined,
        undefined,
        [IdentifierFactory.parameter("str")],
        undefined,
        undefined,
        nullable
            ? ts.factory.createConditionalExpression(
                  ts.factory.createStrictEquality(
                      ts.factory.createStringLiteral("null"),
                      ts.factory.createIdentifier("str"),
                  ),
                  undefined,
                  ts.factory.createNull(),
                  undefined,
                  expr,
              )
            : expr,
    );
