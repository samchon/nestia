import ts from "typescript";

import { IReflectImport } from "../structures/IReflectImport";
import { IReflectType } from "../structures/IReflectType";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace DtoAnalyzer {
  export interface INodeProps {
    checker: ts.TypeChecker;
    imports: IReflectImport[];
    typeNode: ts.TypeNode;
  }
  export interface ITypeProps {
    checker: ts.TypeChecker;
    imports: IReflectImport[];
    type: ts.Type;
  }
  export interface IOutput {
    imports: IReflectImport[];
    type: IReflectType;
  }

  export const analyzeNode = (props: INodeProps): IOutput | null => {
    try {
      const container: IReflectImport[] = [];
      const type: IReflectType = exploreNode(
        {
          checker: props.checker,
          imports: props.imports,
          container,
        },
        props.typeNode,
      );
      return {
        type,
        imports: ImportAnalyzer.merge(container),
      };
    } catch {
      return null;
    }
  };

  export const analyzeType = (props: ITypeProps): IOutput | null => {
    try {
      const container: IReflectImport[] = [];
      const type: IReflectType = exploreType(
        {
          checker: props.checker,
          imports: props.imports,
          container,
        },
        props.type,
      );
      return {
        type,
        imports: ImportAnalyzer.merge(container),
      };
    } catch {
      return null;
    }
  };

  type IContext = Omit<INodeProps, "typeNode"> & {
    container: IReflectImport[];
  };

  const exploreNode = (ctx: IContext, typeNode: ts.TypeNode): IReflectType => {
    // Analyze symbol, and take special cares
    if (ts.isIntersectionTypeNode(typeNode))
      return {
        name: typeNode.types
          .map((child) => exploreNode(ctx, child))
          .map(getEscapedText)
          .join(" & "),
      };
    else if (ts.isUnionTypeNode(typeNode))
      return {
        name: typeNode.types
          .map((child) => exploreNode(ctx, child))
          .map(getEscapedText)
          .join(" | "),
      };
    else if (ts.isArrayTypeNode(typeNode)) {
      const element: IReflectType = exploreNode(ctx, typeNode.elementType);
      return {
        name: "Array",
        typeArguments: [element],
      };
    } else if (ts.isParenthesizedTypeNode(typeNode))
      return {
        name: `(${exploreNode(ctx, typeNode.type).name})`,
      };
    else if (ts.isTypeOperatorNode(typeNode)) {
      const prefix: string | null =
        typeNode.operator === ts.SyntaxKind.KeyOfKeyword
          ? "keyof"
          : typeNode.operator === ts.SyntaxKind.UniqueKeyword
            ? "unique"
            : typeNode.operator === ts.SyntaxKind.ReadonlyKeyword
              ? "readonly"
              : null;
      if (prefix === null)
        return exploreType(ctx, ctx.checker.getTypeFromTypeNode(typeNode));
      return {
        name: `${prefix} ${exploreNode(ctx, typeNode.type).name}`,
      };
    } else if (ts.isTypePredicateNode(typeNode) || ts.isTypeQueryNode(typeNode))
      return exploreType(ctx, ctx.checker.getTypeFromTypeNode(typeNode));
    else if (ts.isTypeReferenceNode(typeNode) === false)
      return {
        name: typeNode.getText(),
      };

    // Find matched import statement
    const name: string = typeNode.typeName.getText();
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
          asterisk: null,
          default: prefix,
          elements: [],
        });
      else if (prefix === imp.asterisk)
        insert({
          file: imp.file,
          asterisk: prefix,
          default: null,
          elements: [],
        });
      else if (imp.elements.includes(prefix))
        insert({
          file: imp.file,
          asterisk: null,
          default: null,
          elements: [prefix],
        });
    if (prefix !== "Promise" && matched === false)
      return exploreType(ctx, ctx.checker.getTypeFromTypeNode(typeNode));

    // Finalize with generic arguments
    if (!!typeNode.typeArguments?.length) {
      const top: ts.TypeNode = typeNode.typeArguments[0];
      if (name === "Promise") return exploreNode(ctx, top);
      return {
        name,
        typeArguments: typeNode.typeArguments.map((child) =>
          exploreNode(ctx, child),
        ),
      };
    }
    return { name };
  };

  const exploreType = (ctx: IContext, type: ts.Type): IReflectType => {
    // Analyze symbol, and take special cares
    const symbol: ts.Symbol | undefined = type.aliasSymbol ?? type.symbol;
    if (type.aliasSymbol === undefined && type.isUnionOrIntersection()) {
      const joiner: string = type.isIntersection() ? " & " : " | ";
      return {
        name: type.types
          .map((child) => exploreType(ctx, child))
          .map(getEscapedText)
          .join(joiner),
      };
    } else if (ctx.checker.isArrayLikeType(type)) {
      const arrayItem: ts.Type | undefined =
        ctx.checker.getElementTypeOfArrayType(type);
      if (arrayItem === undefined) return { name: "Array<any>" };
      return {
        name: "Array",
        typeArguments: [exploreType(ctx, arrayItem)],
      };
    } else if (symbol === undefined)
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
      if (imp.elements.includes(prefix))
        insert({
          file: imp.file,
          asterisk: null,
          default: null,
          elements: [prefix],
        });
    if (prefix !== "Promise" && matched === false)
      emplaceSymbol(ctx, symbol, prefix);

    // Finalize with generic arguments
    const generic: readonly ts.Type[] = type.aliasSymbol
      ? (type.aliasTypeArguments ?? [])
      : ctx.checker.getTypeArguments(type as ts.TypeReference);
    return generic.length
      ? name === "Promise"
        ? exploreType(ctx, generic[0])
        : {
            name,
            typeArguments: generic.map((child) => exploreType(ctx, child)),
          }
      : { name };
  };

  const emplaceSymbol = (
    ctx: IContext,
    symbol: ts.Symbol,
    prefix: string,
  ): void => {
    // GET SOURCE FILE
    const sourceFile: ts.SourceFile | undefined =
      symbol.declarations?.[0]?.getSourceFile();
    if (sourceFile === undefined) return;
    if (sourceFile.fileName.indexOf("/typescript/lib") === -1)
      ctx.container.push({
        file: sourceFile.fileName,
        asterisk: null,
        default: null,
        elements: [prefix],
      });
  };
}

const getEscapedText = (type: IReflectType): string =>
  type.typeArguments
    ? `${type.name}<${type.typeArguments.map(getEscapedText).join(", ")}>`
    : type.name;

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
