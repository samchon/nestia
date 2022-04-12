import tsc from "typescript";

export namespace GenericAnalyzer
{
    export type Dictionary = WeakMap<tsc.Type, tsc.Type>;

    export function analyze(checker: tsc.TypeChecker, classNode: tsc.ClassDeclaration): Dictionary
    {
        const dict: Dictionary = new WeakMap();
        explore(checker, dict, classNode);
        return dict;
    }

    function explore(checker: tsc.TypeChecker, dict: Dictionary, classNode: tsc.ClassDeclaration): void
    {
        if (classNode.heritageClauses === undefined)
            return;

        for (const heritage of classNode.heritageClauses)
            for (const hType of heritage.types)
            {
                // MUST BE CLASS
                const expression: tsc.Type = checker.getTypeAtLocation(hType.expression);
                const superNode: tsc.Declaration = expression.symbol.getDeclarations()![0];

                if (!tsc.isClassDeclaration(superNode))
                    continue;

                // SPECIFY GENERICS
                const usages: ReadonlyArray<tsc.TypeNode> = if_undefined_array(hType.typeArguments);                
                const parameters: ReadonlyArray<tsc.TypeParameterDeclaration> = if_undefined_array(superNode.typeParameters);

                parameters.forEach((param, index) =>
                {
                    const paramType: tsc.Type = checker.getTypeAtLocation(param);
                    const usageType: tsc.Type = (usages[index] !== undefined)
                        ? checker.getTypeAtLocation(usages[index])
                        : checker.getTypeAtLocation(param.default!);

                    dict.set(paramType, usageType);
                });

                // RECUSRIVE EXPLORATION
                explore(checker, dict, superNode);
            }
    }

    function if_undefined_array<T>(array: ReadonlyArray<T> | undefined): ReadonlyArray<T>
    {
        return array !== undefined ? array : [];
    }
}