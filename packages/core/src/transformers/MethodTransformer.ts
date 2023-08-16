import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { TypedExceptionTransformer } from "./TypedExceptionTransformer";
import { TypedRouteTransformer } from "./TypedRouteTransformer";

export namespace MethodTransformer {
    export const transform =
        (project: INestiaTransformProject) =>
        (method: ts.MethodDeclaration): ts.MethodDeclaration => {
            const decorators: readonly ts.Decorator[] | undefined =
                ts.getDecorators
                    ? ts.getDecorators(method)
                    : (method as any).decorators;
            if (!decorators?.length) return method;

            const signature: ts.Signature | undefined =
                project.checker.getSignatureFromDeclaration(method);
            const original: ts.Type | undefined =
                signature &&
                project.checker.getReturnTypeOfSignature(signature);
            const escaped: ts.Type | undefined =
                original && get_escaped_type(project.checker)(original);

            if (escaped === undefined) return method;

            const operator = (deco: ts.Decorator): ts.Decorator => {
                deco = TypedExceptionTransformer.transform(project)(deco);
                deco = TypedRouteTransformer.transform(project)(escaped)(deco);
                return deco;
            };
            if (ts.getDecorators !== undefined)
                return ts.factory.updateMethodDeclaration(
                    method,
                    (method.modifiers || []).map((mod) =>
                        ts.isDecorator(mod) ? operator(mod) : mod,
                    ),
                    method.asteriskToken,
                    method.name,
                    method.questionToken,
                    method.typeParameters,
                    method.parameters,
                    method.type,
                    method.body,
                );
            // eslint-disable-next-line
            return (ts.factory.updateMethodDeclaration as any)(
                method,
                decorators.map(operator),
                (method as any).modifiers,
                method.asteriskToken,
                method.name,
                method.questionToken,
                method.typeParameters,
                method.parameters,
                method.type,
                method.body,
            );
        };
}

const get_escaped_type =
    (checker: ts.TypeChecker) =>
    (type: ts.Type): ts.Type => {
        const symbol: ts.Symbol | undefined =
            type.getSymbol() || type.aliasSymbol;
        return symbol && get_name(symbol) === "Promise"
            ? escape_promise(checker)(type)
            : type;
    };

const escape_promise =
    (checker: ts.TypeChecker) =>
    (type: ts.Type): ts.Type => {
        const generic: readonly ts.Type[] = checker.getTypeArguments(
            type as ts.TypeReference,
        );
        if (generic.length !== 1)
            throw new Error(
                "Error on ImportAnalyzer.analyze(): invalid promise type.",
            );
        return generic[0];
    };

const get_name = (symbol: ts.Symbol): string =>
    explore_name(symbol.getDeclarations()![0].parent)(
        symbol.escapedName.toString(),
    );

const explore_name =
    (decl: ts.Node) =>
    (name: string): string =>
        ts.isModuleBlock(decl)
            ? explore_name(decl.parent.parent)(
                  `${decl.parent.name.getFullText().trim()}.${name}`,
              )
            : name;
