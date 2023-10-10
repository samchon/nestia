import path from "path";
import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { TypedQueryRouteProgrammer } from "../programmers/TypedQueryRouteProgrammer";
import { TypedRouteProgrammer } from "../programmers/TypedRouteProgrammer";

export namespace TypedRouteTransformer {
    export const transform =
        (project: INestiaTransformProject) =>
        (type: ts.Type) =>
        (decorator: ts.Decorator): ts.Decorator => {
            if (!ts.isCallExpression(decorator.expression)) return decorator;

            // CHECK SIGNATURE
            const signature: ts.Signature | undefined =
                project.checker.getResolvedSignature(decorator.expression);
            if (!signature || !signature.declaration) return decorator;

            // CHECK TO BE TRANSFORMED
            const modulo = (() => {
                // CHECK FILENAME
                const location: string = path.resolve(
                    signature.declaration.getSourceFile().fileName,
                );
                if (
                    LIB_PATHS.every((str) => location.indexOf(str) === -1) &&
                    SRC_PATHS.every((str) => location !== str)
                )
                    return null;

                // CHECK DUPLICATE BOOSTER
                if (decorator.expression.arguments.length >= 2) return false;
                else if (decorator.expression.arguments.length === 1) {
                    const last: ts.Expression =
                        decorator.expression.arguments[
                            decorator.expression.arguments.length - 1
                        ];
                    const type: ts.Type =
                        project.checker.getTypeAtLocation(last);
                    if (isObject(project.checker)(type)) return false;
                }
                return location.split(path.sep).at(-1)?.split(".")[0] ===
                    "TypedQuery"
                    ? "TypedQuery"
                    : "TypedRoute";
            })();
            if (modulo === null) return decorator;

            // CHECK TYPE NODE
            const typeNode: ts.TypeNode | undefined =
                project.checker.typeToTypeNode(type, undefined, undefined);
            if (typeNode === undefined) return decorator;

            // DO TRANSFORM
            return ts.factory.createDecorator(
                ts.factory.updateCallExpression(
                    decorator.expression,
                    decorator.expression.expression,
                    decorator.expression.typeArguments,
                    [
                        ...decorator.expression.arguments,
                        (modulo === "TypedQuery"
                            ? TypedQueryRouteProgrammer
                            : TypedRouteProgrammer
                        ).generate(project)(decorator.expression.expression)(
                            type,
                        ),
                    ],
                ),
            );
        };

    const isObject =
        (checker: ts.TypeChecker) =>
        (type: ts.Type): boolean =>
            (type.getFlags() & ts.TypeFlags.Object) !== 0 &&
            !(checker as any).isTupleType(type) &&
            !(checker as any).isArrayType(type) &&
            !(checker as any).isArrayLikeType(type);

    const CLASSES = ["EncryptedRoute", "TypedRoute", "TypedQuery"];
    const LIB_PATHS = CLASSES.map((cla) =>
        path.join(
            "node_modules",
            "@nestia",
            "core",
            "lib",
            "decorators",
            `${cla}.d.ts`,
        ),
    );
    const SRC_PATHS = CLASSES.map((cla) =>
        path.resolve(path.join(__dirname, "..", "decorators", `${cla}.ts`)),
    );
}
