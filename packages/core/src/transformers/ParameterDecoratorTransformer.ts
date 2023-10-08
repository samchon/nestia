import path from "path";
import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { PlainBodyProgrammer } from "../programmers/PlainBodyProgrammer";
import { TypedBodyProgrammer } from "../programmers/TypedBodyProgrammer";
import { TypedHeadersProgrammer } from "../programmers/TypedHeadersProgrammer";
import { TypedParamProgrammer } from "../programmers/TypedParamProgrammer";
import { TypedQueryBodyProgrammer } from "../programmers/TypedQueryBodyProgrammer";
import { TypedQueryProgrammer } from "../programmers/TypedQueryProgrammer";

export namespace ParameterDecoratorTransformer {
    export const transform =
        (project: INestiaTransformProject) =>
        (type: ts.Type) =>
        (decorator: ts.Decorator): ts.Decorator => {
            //----
            // VALIDATIONS
            //----
            // CHECK DECORATOR
            if (!ts.isCallExpression(decorator.expression)) return decorator;

            // SIGNATURE DECLARATION
            const declaration: ts.Declaration | undefined =
                project.checker.getResolvedSignature(
                    decorator.expression,
                )?.declaration;
            if (declaration === undefined) return decorator;

            // FILE PATH
            const file: string = path.resolve(
                declaration.getSourceFile().fileName,
            );
            if (file.indexOf(LIB_PATH) === -1 && file.indexOf(SRC_PATH) === -1)
                return decorator;

            //----
            // TRANSFORMATION
            //----
            // FIND PROGRAMMER
            const programmer: Programmer | undefined =
                FUNCTORS[
                    getName(
                        project.checker.getTypeAtLocation(declaration).symbol,
                    )
                ];
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
                    programmer(project)(decorator.expression.expression)(
                        decorator.expression.arguments,
                    )(type),
                ),
            );
        };
}

type Programmer = (
    project: INestiaTransformProject,
) => (
    modulo: ts.LeftHandSideExpression,
) => (
    parameters: readonly ts.Expression[],
) => (type: ts.Type) => readonly ts.Expression[];

const FUNCTORS: Record<string, Programmer> = {
    EncryptedBody: (project) => (modulo) => (parameters) => (type) =>
        parameters.length
            ? parameters
            : [TypedBodyProgrammer.generate(project)(modulo)(type)],
    TypedBody: (project) => (modulo) => (parameters) => (type) =>
        parameters.length
            ? parameters
            : [TypedBodyProgrammer.generate(project)(modulo)(type)],
    TypedHeaders: (project) => (modulo) => (parameters) => (type) =>
        parameters.length
            ? parameters
            : [TypedHeadersProgrammer.generate(project)(modulo)(type)],
    TypedParam: (project) => TypedParamProgrammer.generate(project),
    TypedQuery: (project) => (modulo) => (parameters) => (type) =>
        parameters.length
            ? parameters
            : [TypedQueryProgrammer.generate(project)(modulo)(type)],
    "TypedQuery.Body": (project) => (modulo) => (parameters) => (type) =>
        parameters.length
            ? parameters
            : [TypedQueryBodyProgrammer.generate(project)(modulo)(type)],
    PlainBody: (project) => (modulo) => (parameters) => (type) =>
        parameters.length
            ? parameters
            : [PlainBodyProgrammer.generate(project)(modulo)(type)],
};

const LIB_PATH = path.join(
    "node_modules",
    "@nestia",
    "core",
    "lib",
    "decorators",
);
const SRC_PATH = path.resolve(path.join(__dirname, "..", "decorators"));

const getName = (symbol: ts.Symbol): string => {
    const parent = symbol.getDeclarations()?.[0]?.parent;
    return parent
        ? exploreName(parent)(symbol.escapedName.toString())
        : "__type";
};
const exploreName =
    (decl: ts.Node) =>
    (name: string): string =>
        ts.isModuleBlock(decl)
            ? exploreName(decl.parent.parent)(
                  `${decl.parent.name.getFullText().trim()}.${name}`,
              )
            : name;
