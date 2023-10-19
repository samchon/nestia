import path from "path";
import ts from "typescript";

import { IController } from "../structures/IController";
import { INestiaProject } from "../structures/INestiaProject";
import { IRoute } from "../structures/IRoute";
import { ITypeTuple } from "../structures/ITypeTuple";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace ExceptionAnalyzer {
    export const analyze =
        (project: INestiaProject) =>
        (
            genericDict: GenericAnalyzer.Dictionary,
            importDict: ImportAnalyzer.Dictionary,
        ) =>
        (controller: IController, func: IController.IFunction) =>
        (
            declaration: ts.MethodDeclaration,
        ): Record<number | "2XX" | "3XX" | "4XX" | "5XX", IRoute.IOutput> => {
            const output: Record<
                number | "2XX" | "3XX" | "4XX" | "5XX",
                IRoute.IOutput
            > = {} as any;
            for (const decorator of declaration.modifiers ?? [])
                if (ts.isDecorator(decorator))
                    analyzeTyped(project)(genericDict, importDict)(
                        controller,
                        func,
                    )(output)(decorator);
            return output;
        };

    const analyzeTyped =
        (project: INestiaProject) =>
        (
            genericDict: GenericAnalyzer.Dictionary,
            importDict: ImportAnalyzer.Dictionary,
        ) =>
        (controller: IController, func: IController.IFunction) =>
        (
            output: Record<
                number | "2XX" | "3XX" | "4XX" | "5XX",
                IRoute.IOutput
            >,
        ) =>
        (decorator: ts.Decorator): boolean => {
            // CHECK DECORATOR
            if (!ts.isCallExpression(decorator.expression)) return false;
            else if ((decorator.expression.typeArguments ?? []).length !== 1)
                return false;

            // CHECK SIGNATURE
            const signature: ts.Signature | undefined =
                project.checker.getResolvedSignature(decorator.expression);
            if (!signature || !signature.declaration) return false;
            else if (
                path
                    .resolve(signature.declaration.getSourceFile().fileName)
                    .indexOf(TYPED_EXCEPTION_PATH) === -1
            )
                return false;

            // GET TYPE INFO
            const node: ts.TypeNode = decorator.expression.typeArguments![0];
            const type: ts.Type = project.checker.getTypeFromTypeNode(node);
            if (type.isTypeParameter()) {
                project.errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: func.name,
                    message:
                        "TypedException() without generic argument specification.",
                });
                return false;
            }

            const tuple: ITypeTuple | null = ImportAnalyzer.analyze(
                project.checker,
                genericDict,
                importDict,
                type,
            );
            if (tuple === null || tuple.typeName === "__type") {
                project.errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: func.name,
                    message: "TypeException() with implicit (unnamed) type.",
                });
                return false;
            }

            // DO ASSIGN
            const matched: IController.IException[] = Object.entries(
                func.exceptions,
            )
                .filter(([_key, value]) => value.type === tuple.typeName)
                .map(([_key, value]) => value);
            for (const m of matched)
                output[m.status] = {
                    type: tuple.type,
                    typeName: tuple.typeName,
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
