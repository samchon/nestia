import path from "path";
import ts from "typescript";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";
import { ITypeTuple } from "../structures/ITypeTuple";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace ExceptionAnalyzer {
    export const analyze =
        (checker: ts.TypeChecker) =>
        (
            genericDict: GenericAnalyzer.Dictionary,
            importDict: ImportAnalyzer.Dictionary,
        ) =>
        (func: IController.IFunction) =>
        (declaration: ts.MethodDeclaration): Record<number, IRoute.IOutput> => {
            const output: Record<number, IRoute.IOutput> = {};
            for (const decorator of declaration.modifiers ?? [])
                if (ts.isDecorator(decorator))
                    analyzeTyped(checker)(genericDict, importDict)(func)(
                        output,
                    )(decorator);
            return output;
        };

    const analyzeTyped =
        (checker: ts.TypeChecker) =>
        (
            genericDict: GenericAnalyzer.Dictionary,
            importDict: ImportAnalyzer.Dictionary,
        ) =>
        (func: IController.IFunction) =>
        (output: Record<number, IRoute.IOutput>) =>
        (decorator: ts.Decorator): boolean => {
            // CHECK DECORATOR
            if (!ts.isCallExpression(decorator.expression)) return false;
            else if ((decorator.expression.typeArguments ?? []).length !== 1)
                return false;

            // CHECK SIGNATURE
            const signature: ts.Signature | undefined =
                checker.getResolvedSignature(decorator.expression);
            if (!signature || !signature.declaration) return false;
            else if (
                path
                    .resolve(signature.declaration.getSourceFile().fileName)
                    .indexOf(TYPED_EXCEPTION_PATH) === -1
            )
                return false;

            // GET TYPE INFO
            const node: ts.TypeNode = decorator.expression.typeArguments![0];
            const type: ts.Type = checker.getTypeFromTypeNode(node);
            if (type.isTypeParameter())
                throw new Error(
                    "Error on @nestia.core.TypedException(): non-specified generic argument.",
                );

            const tuple: ITypeTuple | null = ImportAnalyzer.analyze(
                checker,
                genericDict,
                importDict,
                type,
            );
            if (tuple === null) return false;

            // DO ASSIGN
            const matched: IController.IException[] = Object.entries(
                func.exceptions,
            )
                .filter(([_key, value]) => value.type === tuple.name)
                .map(([_key, value]) => value);
            for (const m of matched)
                output[m.status] = {
                    ...tuple,
                    contentType: "application/json",
                    description: m.description,
                };
            return true;
        };
}

const TYPED_EXCEPTION_PATH = path.join(
    "node_modules",
    "@nestia",
    "core",
    "lib",
    "decorators",
    "TypedException.d.ts",
);
