import path from "path";
import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { TypedBodyProgrammer } from "../programmers/TypedBodyProgrammer";
import { TypedQueryProgrammer } from "../programmers/TypedQueryProgrammer";

export namespace ParameterDecoratorTransformer {
    export function transform(
        project: INestiaTransformProject,
        type: ts.Type,
        decorator: ts.Decorator,
    ): ts.Decorator {
        //----
        // VALIDATIONS
        //----
        // CHECK DECORATOR
        if (!ts.isCallExpression(decorator.expression)) return decorator;
        else if (decorator.expression.arguments.length !== 0) return decorator;

        // SIGNATURE DECLARATION
        const declaration: ts.Declaration | undefined =
            project.checker.getResolvedSignature(
                decorator.expression,
            )?.declaration;
        if (declaration === undefined) return decorator;

        // FILE PATH
        const file: string = path.resolve(declaration.getSourceFile().fileName);
        if (file.indexOf(LIB_PATH) === -1 && file.indexOf(SRC_PATH) === -1)
            return decorator;

        //----
        // TRANSFORMATION
        //----
        // FIND PROGRAMMER
        const programmer: Programmer | undefined =
            FUNCTORS[
                project.checker.getTypeAtLocation(declaration).symbol.name
            ]?.();
        if (programmer === undefined) return decorator;

        // GET TYPE INFO
        const typeNode: ts.TypeNode | undefined =
            project.checker.typeToTypeNode(type, undefined, undefined);
        if (typeNode === undefined) return decorator;

        // DO TRANSFORM
        return ts.factory.createDecorator(
            ts.factory.updateCallExpression(
                decorator.expression,
                decorator.expression.expression,
                decorator.expression.typeArguments,
                [programmer(project, decorator.expression.expression)(type)],
            ),
        );
    }
}

interface Programmer {
    (project: INestiaTransformProject, expression: ts.LeftHandSideExpression): (
        type: ts.Type,
    ) => ts.Expression;
}

const FUNCTORS: Record<string, () => Programmer> = {
    EncryptedBody: () => TypedBodyProgrammer.generate,
    TypedBody: () => TypedBodyProgrammer.generate,
    TypedQuery: () => TypedQueryProgrammer.generate,
};

const LIB_PATH = path.join(
    "node_modules",
    "@nestia",
    "core",
    "lib",
    "decorators",
);
const SRC_PATH = path.resolve(path.join(__dirname, "..", "decorators"));
