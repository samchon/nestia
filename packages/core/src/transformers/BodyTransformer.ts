import path from "path";
import ts from "typescript";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace BodyTransformer {
    export function transform(
        project: INestiaTransformProject,
        type: ts.Type,
        decorator: ts.Decorator,
    ): ts.Decorator {
        if (!ts.isCallExpression(decorator.expression)) return decorator;
        return ts.factory.createDecorator(
            assert(project, type, decorator.expression),
        );
    }

    function assert(
        project: INestiaTransformProject,
        type: ts.Type,
        expression: ts.CallExpression,
    ): ts.LeftHandSideExpression {
        // CHECK SIGNATURE
        const signature: ts.Signature | undefined =
            project.checker.getResolvedSignature(expression);
        if (!signature || !signature.declaration) return expression;

        // CHECK TO BE TRANSFORMED
        const validate: boolean = (() => {
            // CHECK FILENAME
            const location: string = path.resolve(
                signature.declaration.getSourceFile().fileName,
            );
            if (
                LIB_PATHS.every((str) => location.indexOf(str) === -1) &&
                SRC_PATHS.every((str) => location !== str)
            )
                return false;

            // CHECK DUPLICATED TRANSFORMATION
            return expression.arguments.length === 0;
        })();
        if (validate === false) return expression;

        // CHECK TYPE NODE
        const typeNode: ts.TypeNode | undefined =
            project.checker.typeToTypeNode(type, undefined, undefined);
        if (typeNode === undefined) return expression;

        //----
        // TRANSFORMATION
        //----
        // GENERATE ASSERT PLAN
        const arrow: ts.ArrowFunction = AssertProgrammer.generate(
            project,
            expression.expression,
        )(type);

        // UPDATE DECORATOR FUNCTION CALL
        return ts.factory.updateCallExpression(
            expression,
            expression.expression,
            expression.typeArguments,
            [arrow],
        );
    }

    const CLASSES = ["EncryptedBody", "TypedBody"];
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
