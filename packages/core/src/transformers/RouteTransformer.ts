import path from "path";
import ts from "typescript";
import { AssertStringifyProgrammer } from "typia/lib/programmers/AssertStringifyProgrammer";
import { IsStringifyProgrammer } from "typia/lib/programmers/IsStringifyProgrammer";
import { StringifyProgrammer } from "typia/lib/programmers/StringifyProgrammer";
import { ValidateStringifyProgrammer } from "typia/lib/programmers/ValidateStringifyProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace RouteTransformer {
    export function transform(
        project: INestiaTransformProject,
        type: ts.Type,
        decorator: ts.Decorator,
    ): ts.Decorator {
        if (!ts.isCallExpression(decorator.expression)) return decorator;
        return ts.factory.createDecorator(
            stringify(project, type, decorator.expression),
        );
    }

    function stringify(
        project: INestiaTransformProject,
        type: ts.Type,
        expression: ts.CallExpression,
    ): ts.LeftHandSideExpression {
        //----
        // VALIDATIONS
        //----
        // CHECK SIGNATURE
        const signature: ts.Signature | undefined =
            project.checker.getResolvedSignature(expression);
        if (!signature || !signature.declaration) return expression;

        // CHECK TO BE TRANSFORMED
        const done: boolean = (() => {
            // CHECK FILENAME
            const location: string = path.resolve(
                signature.declaration.getSourceFile().fileName,
            );
            if (
                LIB_PATHS.every((str) => location.indexOf(str) === -1) &&
                SRC_PATHS.every((str) => location !== str)
            )
                return false;

            // CHECK DUPLICATE BOOSTER
            if (expression.arguments.length >= 2) return false;
            else if (expression.arguments.length === 1) {
                const last: ts.Expression =
                    expression.arguments[expression.arguments.length - 1];
                const type: ts.Type = project.checker.getTypeAtLocation(last);
                if (isObject(project.checker, type)) return false;
            }
            return true;
        })();
        if (done === false) return expression;

        // CHECK TYPE NODE
        const typeNode: ts.TypeNode | undefined =
            project.checker.typeToTypeNode(type, undefined, undefined);
        if (typeNode === undefined) return expression;

        //----
        // TRANSFORMATION
        //----
        // GENERATE STRINGIFY PLAN
        const parameter = (
            key: string,
            programmer: (
                project: IProject,
                modulo: ts.LeftHandSideExpression,
            ) => (type: ts.Type) => ts.ArrowFunction,
        ) =>
            ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier("type"),
                    ts.factory.createStringLiteral(key),
                ),
                ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier(key),
                    programmer(project, expression.expression)(type),
                ),
            ]);
        const stringify: ts.ObjectLiteralExpression = (() => {
            if (project.options.stringify === "stringify")
                return parameter("stringify", StringifyProgrammer.generate);
            else if (project.options.stringify === "assert")
                return parameter("assert", AssertStringifyProgrammer.generate);
            else if (project.options.stringify === "validate")
                return parameter(
                    "validate",
                    ValidateStringifyProgrammer.generate,
                );
            return parameter("is", IsStringifyProgrammer.generate);
        })();

        // UPDATE DECORATOR FUNCTION CALL
        return ts.factory.updateCallExpression(
            expression,
            expression.expression,
            expression.typeArguments,
            [...expression.arguments, stringify],
        );
    }

    function isObject(checker: ts.TypeChecker, type: ts.Type): boolean {
        return (
            (type.getFlags() & ts.TypeFlags.Object) !== 0 &&
            !(checker as any).isTupleType(type) &&
            !(checker as any).isArrayType(type) &&
            !(checker as any).isArrayLikeType(type)
        );
    }

    const CLASSES = ["EncryptedRoute", "TypedRoute"];
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
