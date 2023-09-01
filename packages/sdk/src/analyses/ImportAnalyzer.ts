import { HashMap } from "tstl/container/HashMap";
import { HashSet } from "tstl/container/HashSet";
import ts from "typescript";

import { ITypeTuple } from "../structures/ITypeTuple";
import { GenericAnalyzer } from "./GenericAnalyzer";

export namespace ImportAnalyzer {
    export interface IOutput {
        features: [string, string[]][];
        alias: string;
    }

    export type Dictionary = HashMap<string, HashSet<string>>;

    export function analyze(
        checker: ts.TypeChecker,
        genericDict: GenericAnalyzer.Dictionary,
        importDict: Dictionary,
        type: ts.Type,
    ): ITypeTuple | null {
        type = get_type(checker, type);
        explore_escaped_name(checker, genericDict, importDict, type);

        try {
            return {
                type,
                typeName: explore_escaped_name(
                    checker,
                    genericDict,
                    importDict,
                    type,
                ),
            };
        } catch {
            return null;
        }
    }

    /* ---------------------------------------------------------
        TYPE
    --------------------------------------------------------- */
    function get_type(checker: ts.TypeChecker, type: ts.Type): ts.Type {
        const symbol: ts.Symbol | undefined = type.getSymbol();
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

    /* ---------------------------------------------------------
        ESCAPED TEXT WITH IMPORT STATEMENTS
    --------------------------------------------------------- */
    function explore_escaped_name(
        checker: ts.TypeChecker,
        genericDict: GenericAnalyzer.Dictionary,
        importDict: Dictionary,
        type: ts.Type,
    ): string {
        //----
        // CONDITIONAL BRANCHES
        //----
        // DECOMPOSE GENERIC ARGUMENT
        while (genericDict.has(type) === true) type = genericDict.get(type)!;

        // PRIMITIVE
        const symbol: ts.Symbol | undefined =
            type.aliasSymbol ?? type.getSymbol();

        // UNION OR INTERSECT
        if (type.aliasSymbol === undefined && type.isUnionOrIntersection()) {
            const joiner: string = type.isIntersection() ? " & " : " | ";
            return type.types
                .map((child) =>
                    explore_escaped_name(
                        checker,
                        genericDict,
                        importDict,
                        child,
                    ),
                )
                .join(joiner);
        }

        // NO SYMBOL
        else if (symbol === undefined)
            return checker.typeToString(
                type,
                undefined,
                ts.TypeFormatFlags.NoTruncation,
            );

        //----
        // SPECIALIZATION
        //----
        const name: string = get_name(symbol);
        const sourceFile: ts.SourceFile =
            symbol.declarations![0].getSourceFile();

        if (sourceFile.fileName.indexOf("typescript/lib") === -1) {
            const set: HashSet<string> = importDict.take(
                sourceFile.fileName,
                () => new HashSet(),
            );
            set.insert(name.split(".")[0]);
        }

        // CHECK GENERIC
        const generic: readonly ts.Type[] = type.aliasSymbol
            ? type.aliasTypeArguments || []
            : checker.getTypeArguments(type as ts.TypeReference);
        return generic.length
            ? name === "Promise"
                ? explore_escaped_name(
                      checker,
                      genericDict,
                      importDict,
                      generic[0],
                  )
                : `${name}<${generic
                      .map((child) =>
                          explore_escaped_name(
                              checker,
                              genericDict,
                              importDict,
                              child,
                          ),
                      )
                      .join(", ")}>`
            : name;
    }

    function explore_name(name: string, decl: ts.Node): string {
        return ts.isModuleBlock(decl)
            ? explore_name(
                  `${decl.parent.name.getFullText().trim()}.${name}`,
                  decl.parent.parent,
              )
            : name;
    }
}
