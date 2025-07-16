import ts from "typescript";

import { IReflectImport } from "../structures/IReflectImport";
import { IReflectType } from "../structures/IReflectType";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace DtoAnalyzer {
  export interface IProps {
    checker: ts.TypeChecker;
    imports: IReflectImport[];
    type: ts.Type;
  }
  export interface IOutput {
    imports: IReflectImport[];
    type: IReflectType;
  }

  export const analyze = (props: IProps): IOutput | null => {
    try {
      const container: IReflectImport[] = [];
      const type: IReflectType = explore(
        {
          checker: props.checker,
          imports: props.imports,
          container,
        },
        escape(props.checker, props.type),
      );
      return {
        type,
        imports: ImportAnalyzer.merge(container),
      };
    } catch {
      return null;
    }
  };

  type IContext = Omit<IProps, "type"> & {
    container: IReflectImport[];
  };

  const explore = (ctx: IContext, type: ts.Type): IReflectType => {
    // Analyze symbol, and take special cares
    const symbol: ts.Symbol | undefined = type.aliasSymbol ?? type.symbol;
    if (type.aliasSymbol === undefined && type.isUnionOrIntersection())
      return {
        name: type.types
          .map((child) => explore(ctx, child))
          .map(getEscapedText)
          .join(type.isIntersection() ? " & " : " | "),
      };
    else if (symbol === undefined)
      return {
        name: ctx.checker.typeToString(
          type,
          undefined,
          ts.TypeFormatFlags.NoTruncation,
        ),
      };

    // Find matched import statement
    const name: string = getNameOfSymbol(symbol);
    const prefix: string = name.split(".")[0];

    let matched: boolean = false;
    const insert = (imp: IReflectImport): void => {
      matched ||= true;
      ctx.container.push(imp);
    };
    for (const imp of ctx.imports)
      if (prefix === imp.default)
        insert({
          file: imp.file,
          default: prefix,
          elements: [],
          asterisk: null,
        });
      else if (prefix === imp.asterisk)
        insert({
          file: imp.file,
          default: null,
          elements: [],
          asterisk: prefix,
        });
      else if (imp.elements.includes(prefix))
        insert({
          file: imp.file,
          default: null,
          elements: [prefix],
          asterisk: null,
        });
    if (matched === false) exploreNotFound(ctx, symbol, prefix);

    // Finalize with generic arguments
    const generic: readonly ts.Type[] = type.aliasSymbol
      ? (type.aliasTypeArguments ?? [])
      : ctx.checker.getTypeArguments(type as ts.TypeReference);
    if (generic.length !== 0) {
      if (name === "Promise") return explore(ctx, generic[0]);
      else
        return {
          name,
          typeArguments: generic.map((child) => explore(ctx, child)),
        };
    }
    return { name };
  };

  const exploreNotFound = (
    ctx: IContext,
    symbol: ts.Symbol,
    prefix: string,
  ): void => {
    // GET SOURCE FILE
    const sourceFile: ts.SourceFile | undefined =
      symbol.declarations?.[0]?.getSourceFile();
    if (sourceFile === undefined) return;
    else if (sourceFile.fileName.indexOf("/typescript/lib") === -1)
      ctx.container.push({
        file: sourceFile.fileName,
        asterisk: null,
        default: null,
        elements: [prefix],
      });
  };
}

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

const exploreName = (name: string, decl?: ts.Node): string =>
  decl && ts.isModuleBlock(decl)
    ? exploreName(
        `${decl.parent.name.getFullText().trim()}.${name}`,
        decl.parent.parent,
      )
    : name;

const getEscapedText = (type: IReflectType): string =>
  type.typeArguments
    ? `${type.name}<${type.typeArguments.map(getEscapedText).join(", ")}>`
    : type.name;
