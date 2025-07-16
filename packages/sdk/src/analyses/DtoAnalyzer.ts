import ts from "typescript";

import { IReflectImport } from "../structures/IReflectImport";
import { IReflectType } from "../structures/IReflectType";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace DtoAnalyzer {
  export interface IProps {
    checker: ts.TypeChecker;
    imports: IReflectImport[];
    typeNode: ts.TypeNode;
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

  type IContext = Omit<IProps, "typeNode"> & {
    container: IReflectImport[];
  };

  const explore = (ctx: IContext, typeNode: ts.TypeNode): IReflectType => {
    // Analyze symbol, and take special cares
    if (ts.isIntersectionTypeNode(typeNode))
      return {
        name: typeNode.types
          .map((child) => explore(ctx, child))
          .map(getEscapedText)
          .join(" & "),
      };
    else if (ts.isUnionTypeNode(typeNode))
      return {
        name: typeNode.types
          .map((child) => explore(ctx, child))
          .map(getEscapedText)
          .join(" | "),
      };
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
    if (name !== "Promise" && matched === false) {
      const symbol: ts.Symbol | undefined = ctx.checker.getSymbolAtLocation(
        typeNode.typeName,
      );
      if (symbol !== undefined)
        exploreNotFound(ctx, {
          symbol,
          prefix,
        });
    }

    // Finalize with generic arguments
    if (!!typeNode.typeArguments?.length) {
      const top: ts.TypeNode = typeNode.typeArguments[0];
      if (name === "Promise") return explore(ctx, top);
      return {
        name,
        typeArguments: typeNode.typeArguments.map((child) =>
          explore(ctx, child),
        ),
      };
    }
    return { name };
  };

  const exploreNotFound = (
    ctx: IContext,
    props: {
      symbol: ts.Symbol;
      prefix: string;
    },
  ): void => {
    // GET SOURCE FILE
    const sourceFile: ts.SourceFile | undefined =
      props.symbol.declarations?.[0]?.getSourceFile();
    if (sourceFile === undefined) return;
    else if (sourceFile.fileName.indexOf("/typescript/lib") === -1)
      ctx.container.push({
        file: sourceFile.fileName,
        asterisk: null,
        default: null,
        elements: [props.prefix],
      });
  };
}

const getEscapedText = (type: IReflectType): string =>
  type.typeArguments
    ? `${type.name}<${type.typeArguments.map(getEscapedText).join(", ")}>`
    : type.name;
