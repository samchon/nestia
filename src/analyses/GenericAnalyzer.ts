import ts from "typescript";

export namespace GenericAnalyzer
{
    export type Dictionary = WeakMap<ts.Type, ts.Type>;

    export function analyze(checker: ts.TypeChecker, classNode: ts.ClassDeclaration): Dictionary
    {
        const dict: Dictionary = new WeakMap();
        explore(checker, dict, classNode);
        return dict;
    }

    function explore(checker: ts.TypeChecker, dict: Dictionary, classNode: ts.ClassDeclaration): void
    {
        if (classNode.heritageClauses === undefined)
            return;

        for (const heritage of classNode.heritageClauses)
            for (const hType of heritage.types)
            {
                // MUST BE CLASS
                const expression: ts.Type = checker.getTypeAtLocation(hType.expression);
                const superNode: ts.Declaration = expression.symbol.getDeclarations()![0];

                if (!ts.isClassDeclaration(superNode))
                    continue;

                // SPECIFY GENERICS
                const usages: ReadonlyArray<ts.TypeNode> = hType.typeArguments || [];                
                const parameters: ReadonlyArray<ts.TypeParameterDeclaration> = superNode.typeParameters || [];

                parameters.forEach((param, index) =>
                {
                    const paramType: ts.Type = checker.getTypeAtLocation(param);
                    const usageType: ts.Type = (usages[index] !== undefined)
                        ? checker.getTypeAtLocation(usages[index])
                        : checker.getTypeAtLocation(param.default!);

                    dict.set(paramType, usageType);
                });

                // RECUSRIVE EXPLORATION
                explore(checker, dict, superNode);
            }
    }
}