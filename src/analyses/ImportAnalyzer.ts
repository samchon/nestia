import * as tsc from "typescript";

import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";
import { GenericAnalyzer } from "./GenericAnalyzer";

export namespace ImportAnalyzer
{
    export interface IOutput
    {
        features: [string, string[]][];
        alias: string;
    }

    export type Dictionary = HashMap<string, HashSet<string>>;

    export function analyze
        (
            checker: tsc.TypeChecker, 
            genericDict: GenericAnalyzer.Dictionary, 
            importDict: Dictionary, 
            type: tsc.Type
        ): string
    {
        return explore(checker, genericDict, importDict, type);
    }

    function explore
        (
            checker: tsc.TypeChecker, 
            genericDict: GenericAnalyzer.Dictionary, 
            importDict: Dictionary, 
            type: tsc.Type
        ): string
    {
        //----
        // CONDITIONAL BRANCHES
        //----
        // DECOMPOSE GENERIC ARGUMENT
        while (genericDict.has(type) === true)
            type = genericDict.get(type)!;

        // PRIMITIVE
        const symbol: tsc.Symbol | undefined = type.getSymbol();
        if (symbol === undefined)
            return checker.typeToString(type, undefined, undefined);
        
        // UNION OR INTERSECT
        else if (type.isUnionOrIntersection())
        {
            const joiner: string = type.isIntersection() ? " & " : " | ";
            return type.types.map(child => explore(checker, genericDict, importDict, child)).join(joiner);
        }

        //----
        // SPECIALIZATION
        //----
        const name: string = get_name(symbol);
        const sourceFile: tsc.SourceFile = symbol.declarations[0]!.getSourceFile();

        if (sourceFile.fileName.indexOf("typescript/lib") === -1)
        {
            let it: HashMap.Iterator<string, HashSet<string>> = importDict.find(sourceFile.fileName);
            if (it.equals(importDict.end()) === true)
                it = importDict.emplace(sourceFile.fileName, new HashSet()).first;
            it.second.insert(name.split(".")[0]);
        }

        // CHECK GENERIC
        const generic: readonly tsc.Type[] = checker.getTypeArguments(type as tsc.TypeReference);
        if (generic.length)
        {
            return name === "Promise"
                ? explore(checker, genericDict, importDict, generic[0])
                : `${name}<${generic.map(child => explore(checker, genericDict, importDict, child)).join(", ")}>`;
        }
        else
            return name;
    }

    function get_name(symbol: tsc.Symbol): string
    {
        let name: string = symbol.escapedName.toString();
        let decl: tsc.Node = symbol.getDeclarations()![0].parent;

        while (tsc.isModuleBlock(decl))
        {
            name = `${decl.parent.name.getText()}.${name}`;
            decl = decl.parent.parent;
        }
        return name;
    }
}