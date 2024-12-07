import path from "path";
import { HashSet, Singleton, hash } from "tstl";
import ts from "typescript";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { GenericAnalyzer } from "../analyses/GenericAnalyzer";
import { IOperationMetadata } from "./IOperationMetadata";
import { ISdkOperationTransformerContext } from "./ISdkOperationTransformerContext";
import { SdkOperationProgrammer } from "./SdkOperationProgrammer";

export namespace SdkOperationTransformer {
  export const iterateFile =
    (checker: ts.TypeChecker) => (api: ts.TransformationContext) => {
      const context: ISdkOperationTransformerContext = {
        checker,
        transformer: api,
        collection: collection.get(),
      };
      return (file: ts.SourceFile): ts.SourceFile => {
        if (file.isDeclarationFile === true) return file;
        const visitor: IVisitor = {
          done: false,
          visited: new HashSet(),
        };
        file = ts.visitEachChild(
          file,
          (node) =>
            iterateNode({
              context,
              visitor,
              node,
            }),
          api,
        );
        if (visitor.done === false) return file;
        return ts.factory.updateSourceFile(file, [
          ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
              false,
              undefined,
              ts.factory.createNamespaceImport(
                ts.factory.createIdentifier("__OperationMetadata"),
              ),
            ),
            ts.factory.createStringLiteral(
              "@nestia/sdk/lib/decorators/OperationMetadata",
            ),
            undefined,
          ),
          ...file.statements,
        ]);
      };
    };

  interface IVisitor {
    done: boolean;
    visited: HashSet<MethodKey>;
  }

  const iterateNode = (props: {
    context: ISdkOperationTransformerContext;
    visitor: IVisitor;
    node: ts.Node;
  }): ts.Node =>
    ts.visitEachChild(
      transformNode(props),
      (child) =>
        iterateNode({
          ...props,
          node: child,
        }),
      props.context.transformer,
    );

  const transformNode = (props: {
    context: ISdkOperationTransformerContext;
    visitor: IVisitor;
    node: ts.Node;
  }): ts.Node => {
    return ts.isClassDeclaration(props.node)
      ? transformClass({
          ...props,
          node: props.node,
        })
      : props.node;
  };

  const transformClass = (props: {
    context: ISdkOperationTransformerContext;
    visitor: IVisitor;
    node: ts.ClassDeclaration;
  }): ts.ClassDeclaration => {
    const generics: WeakMap<ts.Type, ts.Type> = GenericAnalyzer.analyze(
      props.context.checker,
      props.node,
    );

    // TO AVOID COMMENT COMPILATION BUG
    const symbolDict: Map<string, ts.Symbol> = new Map();
    const classType: ts.InterfaceType = props.context.checker.getTypeAtLocation(
      props.node,
    ) as ts.InterfaceType;
    for (const symbol of classType.getProperties()) {
      const declaration: ts.Declaration | undefined = (symbol.declarations ||
        [])[0];
      if (!declaration || !ts.isMethodDeclaration(declaration)) continue;
      const identifier = declaration.name;
      if (!ts.isIdentifier(identifier)) continue;
      symbolDict.set(identifier.escapedText.toString(), symbol);
    }
    return ts.factory.updateClassDeclaration(
      props.node,
      props.node.modifiers,
      props.node.name,
      props.node.typeParameters,
      props.node.heritageClauses,
      props.node.members.map((m) =>
        ts.isMethodDeclaration(m)
          ? transformMethod({
              ...props,
              generics,
              class: props.node,
              node: m,
              symbol: symbolDict.get(m.name.getText()),
            })
          : m,
      ),
    );
  };

  const transformMethod = (props: {
    context: ISdkOperationTransformerContext;
    visitor: IVisitor;
    class: ts.ClassDeclaration;
    generics: WeakMap<ts.Type, ts.Type>;
    node: ts.MethodDeclaration;
    symbol: ts.Symbol | undefined;
  }): ts.MethodDeclaration => {
    const decorators: readonly ts.Decorator[] | undefined = ts.getDecorators
      ? ts.getDecorators(props.node)
      : (props.node as any).decorators;
    if (!decorators?.length) return props.node;

    const key: MethodKey = new MethodKey(
      props.class.name?.getText() ?? "",
      props.node.name.getText(),
    );
    props.visitor.done ||= true;
    if (props.visitor.visited.has(key)) return props.node;
    else props.visitor.visited.insert(key);

    const metadata: IOperationMetadata = SdkOperationProgrammer.write({
      ...props,
      exceptions: getExceptionTypes({
        checker: props.context.checker,
        decorators,
      }),
    });
    return ts.factory.updateMethodDeclaration(
      props.node,
      [
        ...(props.node.modifiers ?? []),
        ts.factory.createDecorator(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier(
              "__OperationMetadata.OperationMetadata",
            ),
            undefined,
            [
              ts.factory.createAsExpression(
                LiteralFactory.write(metadata),
                TypeFactory.keyword("any"),
              ),
            ],
          ),
        ),
      ],
      props.node.asteriskToken,
      props.node.name,
      props.node.questionToken,
      props.node.typeParameters,
      props.node.parameters,
      props.node.type,
      props.node.body,
    );
  };

  const getExceptionTypes = (props: {
    checker: ts.TypeChecker;
    decorators: readonly ts.Decorator[];
  }) =>
    props.decorators
      .map((deco) => {
        if (false === ts.isCallExpression(deco.expression)) return null;

        const signature: ts.Signature | undefined =
          props.checker.getResolvedSignature(deco.expression);
        if (signature === undefined) return null;
        else if (!signature.declaration) return null;

        const location: string = path.resolve(
          signature.declaration.getSourceFile()?.fileName ?? "",
        );
        if (
          location.includes(TYPED_EXCEPTION_LIB_PATH) === false &&
          location.includes(TYPED_EXCEPTION_MONO_PATH) === false
        )
          return null;
        else if (deco.expression.typeArguments?.length !== 1) return null;
        return deco.expression.typeArguments[0];
      })
      .filter((t) => t !== null);
}

class MethodKey {
  public constructor(
    public readonly className: string,
    public readonly methodName: string,
  ) {}

  public equals(o: MethodKey): boolean {
    return this.className === o.className && this.methodName === o.methodName;
  }

  public hashCode(): number {
    return hash(this.className, this.methodName);
  }
}

const TYPED_EXCEPTION_LIB_PATH = path.join(
  "@nestia",
  "core",
  "lib",
  "decorators",
  `TypedException.d.ts`,
);
const TYPED_EXCEPTION_MONO_PATH = path.join(
  "packages",
  "core",
  "lib",
  "decorators",
  `TypedException.d.ts`,
);

const collection = new Singleton(
  () =>
    new MetadataCollection({
      replace: MetadataCollection.replace,
    }),
);
