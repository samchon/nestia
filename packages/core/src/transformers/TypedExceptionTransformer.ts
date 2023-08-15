import path from "path";
import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { TypedExceptionProgrammer } from "../programmers/TypedExceptionProgrammer";

export namespace TypedExceptionTransformer {
    export const transform =
        (project: INestiaTransformProject) =>
        (decorator: ts.Decorator): ts.Decorator => {
            if (!ts.isCallExpression(decorator.expression)) return decorator;

            // CHECK SIGNATURE
            const signature: ts.Signature | undefined =
                project.checker.getResolvedSignature(decorator.expression);
            if (!signature || !signature.declaration) return decorator;

            // CHECK TO BE TRANSFORMED
            const done: boolean = (() => {
                // CHECK FILENAME
                const location: string = path.resolve(
                    signature.declaration.getSourceFile().fileName,
                );
                if (location.indexOf(LIB_PATH) === -1 && location !== SRC_PATH)
                    return false;

                // CHECK DUPLICATED
                return decorator.expression.arguments.length !== 3;
            })();
            if (done === false) return decorator;

            // DO TRANSFORM
            return ts.factory.createDecorator(
                TypedExceptionProgrammer.generate(project)(
                    decorator.expression,
                ),
            );
        };

    const LIB_PATH = path.join(
        "node_modules",
        "@nestia",
        "core",
        "lib",
        "decorators",
        `TypedException.d.ts`,
    );
    const SRC_PATH = path.resolve(
        path.join(__dirname, "..", "decorators", `TypedException.ts`),
    );
}
