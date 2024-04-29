import { HashMap, HashSet } from "tstl";
import ts from "typescript";

import { ITypeTuple } from "../structures/ITypeTuple";
import { GenericAnalyzer } from "./GenericAnalyzer";

export namespace ImportAnalyzer {
  export interface IOutput {
    features: [string, string[]][];
    alias: string;
  }

  export type Dictionary = HashMap<string, HashSet<string>>;

  export const analyze =
    (checker: ts.TypeChecker) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: Dictionary;
      type: ts.Type;
    }): ITypeTuple | null => {
      const type: ts.Type = get_type(checker)(props.type);
      explore_escaped_name(checker)({
        ...props,
        type,
      });
      try {
        return {
          type,
          typeName: explore_escaped_name(checker)({
            ...props,
            type,
          }),
        };
      } catch {
        return null;
      }
    };

  /* ---------------------------------------------------------
        TYPE
    --------------------------------------------------------- */
  const get_type =
    (checker: ts.TypeChecker) =>
    (type: ts.Type): ts.Type => {
      const symbol: ts.Symbol | undefined = type.getSymbol();
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
    explore_name(
      symbol.escapedName.toString(),
      symbol.getDeclarations()?.[0]?.parent,
    );

  /* ---------------------------------------------------------
        ESCAPED TEXT WITH IMPORT STATEMENTS
    --------------------------------------------------------- */
  const explore_escaped_name =
    (checker: ts.TypeChecker) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: Dictionary;
      type: ts.Type;
    }): string => {
      //----
      // CONDITIONAL BRANCHES
      //----
      // DECOMPOSE GENERIC ARGUMENT
      let type: ts.Type = props.type;
      while (props.generics.has(type) === true)
        type = props.generics.get(type)!;

      // PRIMITIVE
      const symbol: ts.Symbol | undefined =
        type.aliasSymbol ?? type.getSymbol();

      // UNION OR INTERSECT
      if (type.aliasSymbol === undefined && type.isUnionOrIntersection()) {
        const joiner: string = type.isIntersection() ? " & " : " | ";
        return type.types
          .map((child) =>
            explore_escaped_name(checker)({
              ...props,
              type: child,
            }),
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
      const sourceFile: ts.SourceFile | undefined =
        symbol.declarations?.[0]?.getSourceFile();
      if (sourceFile === undefined) return name;
      else if (sourceFile.fileName.indexOf("typescript/lib") === -1) {
        const set: HashSet<string> = props.imports.take(
          sourceFile.fileName,
          () => new HashSet(),
        );
        set.insert(name.split(".")[0]);
      }

      // CHECK GENERIC
      const generic: readonly ts.Type[] = type.aliasSymbol
        ? type.aliasTypeArguments ?? []
        : checker.getTypeArguments(type as ts.TypeReference);
      return generic.length
        ? name === "Promise"
          ? explore_escaped_name(checker)({
              ...props,
              type: generic[0],
            })
          : `${name}<${generic
              .map((child) =>
                explore_escaped_name(checker)({
                  ...props,
                  type: child,
                }),
              )
              .join(", ")}>`
        : name;
    };

  const explore_name = (name: string, decl?: ts.Node): string =>
    decl && ts.isModuleBlock(decl)
      ? explore_name(
          `${decl.parent.name.getFullText().trim()}.${name}`,
          decl.parent.parent,
        )
      : name;
}
