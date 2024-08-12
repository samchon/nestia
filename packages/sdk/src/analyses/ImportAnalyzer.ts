import ts from "typescript";

import { IReflectType } from "../structures/IReflectType";
import { IReflectTypeImport } from "../structures/IReflectTypeImport";
import { MapUtil } from "../utils/MapUtil";

export namespace ImportAnalyzer {
  export interface IOutput {
    imports: IReflectTypeImport[];
    type: IReflectType | null;
  }
  export const analyze = (
    checker: ts.TypeChecker,
    generics: WeakMap<ts.Type, ts.Type>,
    type: ts.Type,
  ): IOutput => {
    const imports: Map<string, Set<string>> = new Map();
    try {
      type = escape(checker, type);
      return {
        type: explore({
          checker,
          generics,
          imports,
          type,
        }),
        imports: [...imports].map(([file, instances]) => ({
          file,
          instances: Array.from(instances),
        })),
      };
    } catch {
      return {
        imports: [],
        type: null,
      };
    }
  };

  export const unique = (
    imports: IReflectTypeImport[],
  ): IReflectTypeImport[] => {
    const map: Map<string, Set<string>> = new Map();
    imports.forEach(({ file, instances }) => {
      const set: Set<string> = MapUtil.take(map, file, () => new Set());
      instances.forEach((instance) => set.add(instance));
    });
    return [...map].map(([file, instances]) => ({
      file,
      instances: Array.from(instances),
    }));
  };

  /* ---------------------------------------------------------
    TYPE
  --------------------------------------------------------- */
  const escape = (checker: ts.TypeChecker, type: ts.Type): ts.Type => {
    if (type.symbol && getNameOfSymbol(type.symbol) === "Promise") {
      const generic: readonly ts.Type[] = checker.getTypeArguments(
        type as ts.TypeReference,
      );
      if (generic.length !== 1)
        throw new Error(
          "Error on ImportAnalyzer.analyze(): invalid promise type.",
        );
      type = generic[0];
    }
    return type;
  };

  const getNameOfSymbol = (symbol: ts.Symbol): string =>
    exploreName(
      symbol.escapedName.toString(),
      symbol.getDeclarations()?.[0]?.parent,
    );

  /* ---------------------------------------------------------
    ESCAPED TEXT WITH IMPORT STATEMENTS
  --------------------------------------------------------- */
  const explore = (props: {
    checker: ts.TypeChecker;
    generics: WeakMap<ts.Type, ts.Type>;
    imports: Map<string, Set<string>>;
    type: ts.Type;
  }): IReflectType => {
    //----
    // CONDITIONAL BRANCHES
    //----
    // DECOMPOSE GENERIC ARGUMENT
    let type: ts.Type = props.type;
    while (props.generics.has(type) === true) type = props.generics.get(type)!;

    // PRIMITIVE
    const symbol: ts.Symbol | undefined = type.aliasSymbol ?? type.symbol;

    // UNION OR INTERSECT
    if (type.aliasSymbol === undefined && type.isUnionOrIntersection()) {
      const joiner: string = type.isIntersection() ? " & " : " | ";
      return {
        name: type.types
          .map((child) =>
            explore({
              ...props,
              type: child,
            }),
          )
          .map(getName)
          .join(joiner),
      };
    }
    // NO SYMBOL
    else if (symbol === undefined)
      return {
        name: props.checker.typeToString(
          type,
          undefined,
          ts.TypeFormatFlags.NoTruncation,
        ),
      };

    //----
    // SPECIALIZATION
    //----
    const name: string = getNameOfSymbol(symbol);
    const sourceFile: ts.SourceFile | undefined =
      symbol.declarations?.[0]?.getSourceFile();
    if (sourceFile === undefined) return { name };
    else if (sourceFile.fileName.indexOf("typescript/lib") === -1) {
      const set: Set<string> = MapUtil.take(
        props.imports,
        sourceFile.fileName,
        () => new Set(),
      );
      set.add(name.split(".")[0]);
    }

    // CHECK GENERIC
    const generic: readonly ts.Type[] = type.aliasSymbol
      ? type.aliasTypeArguments ?? []
      : props.checker.getTypeArguments(type as ts.TypeReference);
    return generic.length
      ? name === "Promise"
        ? explore({
            ...props,
            type: generic[0],
          })
        : {
            name,
            typeArguments: generic.map((child) =>
              explore({
                ...props,
                type: child,
              }),
            ),
          }
      : { name };
  };

  const exploreName = (name: string, decl?: ts.Node): string =>
    decl && ts.isModuleBlock(decl)
      ? exploreName(
          `${decl.parent.name.getFullText().trim()}.${name}`,
          decl.parent.parent,
        )
      : name;
}

const getName = (type: IReflectType): string =>
  type.typeArguments
    ? `${type.name}<${type.typeArguments.map(getName).join(", ")}>`
    : type.name;
