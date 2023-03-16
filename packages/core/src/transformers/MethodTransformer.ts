import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { MethodDecoratorTransformer } from "./MethodDecoratorTransformer";

export namespace MethodTransformer {
    export function transform(
        project: INestiaTransformProject,
        method: ts.MethodDeclaration,
    ): ts.MethodDeclaration {
        const decorators: readonly ts.Decorator[] | undefined = ts.getDecorators
            ? ts.getDecorators(method)
            : (method as any).decorators;
        if (!decorators?.length) return method;

        const signature: ts.Signature | undefined =
            project.checker.getSignatureFromDeclaration(method);
        const original: ts.Type | undefined =
            signature && project.checker.getReturnTypeOfSignature(signature);
        const escaped: ts.Type | undefined =
            original && get_escaped_type(project.checker, original);

        if (escaped === undefined) return method;

        if (ts.getDecorators !== undefined)
            return ts.factory.updateMethodDeclaration(
                method,
                (method.modifiers || []).map((mod) =>
                    ts.isDecorator(mod)
                        ? MethodDecoratorTransformer.transform(
                              project,
                              escaped,
                              mod,
                          )
                        : mod,
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
        return ts.factory.updateMethodDeclaration(
            method,
            decorators.map((deco) =>
                MethodDecoratorTransformer.transform(project, escaped, deco),
            ),
            (method as any).modifiers,
            method.asteriskToken,
            method.name,
            method.questionToken,
            method.typeParameters,
            method.parameters,
            method.type,
            method.body,
        );
    }
}

function get_escaped_type(checker: ts.TypeChecker, type: ts.Type): ts.Type {
    const symbol: ts.Symbol | undefined = type.getSymbol() || type.aliasSymbol;
    return symbol && get_name(symbol) === "Promise"
        ? escape_promise(checker, type)
        : type;
}

function escape_promise(checker: ts.TypeChecker, type: ts.Type): ts.Type {
    const generic: readonly ts.Type[] = checker.getTypeArguments(
        type as ts.TypeReference,
    );
    if (generic.length !== 1)
        throw new Error(
            "Error on ImportAnalyzer.analyze(): invalid promise type.",
        );
    return generic[0];
}

function get_name(symbol: ts.Symbol): string {
    return explore_name(
        symbol.escapedName.toString(),
        symbol.getDeclarations()![0].parent,
    );
}

function explore_name(name: string, decl: ts.Node): string {
    return ts.isModuleBlock(decl)
        ? explore_name(
              `${decl.parent.name.getFullText().trim()}.${name}`,
              decl.parent.parent,
          )
        : name;
}
