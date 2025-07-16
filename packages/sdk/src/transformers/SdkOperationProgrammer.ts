import { Singleton } from "tstl";
import ts from "typescript";
import { CommentFactory } from "typia/lib/factories/CommentFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataObjectType } from "typia/lib/schemas/metadata/MetadataObjectType";
import { ValidationPipe } from "typia/lib/typings/ValidationPipe";
import { Escaper } from "typia/lib/utils/Escaper";

import { DtoAnalyzer } from "../analyses/DtoAnalyzer";
import { IReflectImport } from "../structures/IReflectImport";
import { MetadataUtil } from "../utils/MetadataUtil";
import { IOperationMetadata } from "./IOperationMetadata";
import { ISdkOperationTransformerContext } from "./ISdkOperationTransformerContext";

export namespace SdkOperationProgrammer {
  export interface IProps {
    context: ISdkOperationTransformerContext;
    imports: Singleton<IReflectImport[]>;
    node: ts.MethodDeclaration;
    symbol: ts.Symbol | undefined;
    exceptions: ts.TypeNode[];
  }
  export const write = (p: IProps): IOperationMetadata => ({
    parameters: p.node.parameters.map((parameter, index) =>
      writeParameter({
        context: p.context,
        imports: p.imports,
        parameter,
        index,
      }),
    ),
    success: writeResponse({
      context: p.context,
      imports: p.imports,
      typeNode: p.node.type ? escapePromise(p.node.type) : null,
    }),
    exceptions: p.exceptions.map((e) =>
      writeResponse({
        context: p.context,
        imports: p.imports,
        typeNode: e,
      }),
    ),
    jsDocTags: p.symbol?.getJsDocTags() ?? [],
    description: p.symbol
      ? (CommentFactory.description(p.symbol) ?? null)
      : null,
  });

  const writeParameter = (props: {
    context: ISdkOperationTransformerContext;
    imports: Singleton<IReflectImport[]>;
    parameter: ts.ParameterDeclaration;
    index: number;
  }): IOperationMetadata.IParameter => {
    const symbol: ts.Symbol | undefined =
      props.context.checker.getSymbolAtLocation(props.parameter);
    const common: IOperationMetadata.IResponse = writeResponse({
      context: props.context,
      imports: props.imports,
      typeNode: props.parameter.type ?? null,
    });
    const optional: boolean = props.parameter.questionToken !== undefined;
    if (common.primitive.success)
      common.primitive.data.metadata.optional = optional;
    if (common.resolved.success)
      common.resolved.data.metadata.optional = optional;

    return {
      ...common,
      name: props.parameter.name.getText(),
      index: props.index,
      description: (symbol && CommentFactory.description(symbol)) ?? null,
      jsDocTags: symbol?.getJsDocTags() ?? [],
    };
  };

  const writeResponse = (p: {
    context: ISdkOperationTransformerContext;
    imports: Singleton<IReflectImport[]>;
    typeNode: ts.TypeNode | null;
  }): IOperationMetadata.IResponse => {
    const analyzed: DtoAnalyzer.IOutput | null = p.typeNode
      ? DtoAnalyzer.analyze({
          checker: p.context.checker,
          imports: p.imports.get(),
          typeNode: p.typeNode,
        })
      : {
          type: { name: "any" },
          imports: [],
        };
    const [primitive, resolved] = [true, false].map((escape) =>
      MetadataFactory.analyze({
        checker: p.context.checker,
        transformer: p.context.transformer,
        options: {
          escape,
          constant: true,
          absorb: true,
        },
        collection: p.context.collection,
        type: p.typeNode
          ? p.context.checker.getTypeFromTypeNode(p.typeNode)
          : null,
      }),
    );
    return {
      ...(analyzed
        ? analyzed
        : {
            imports: [],
            type: null,
          }),
      primitive: writeSchema({
        collection: p.context.collection,
        result: primitive,
      }),
      resolved: writeSchema({
        collection: p.context.collection,
        result: resolved,
      }),
    };
  };

  const writeSchema = (p: {
    collection: MetadataCollection;
    result: ValidationPipe<Metadata, MetadataFactory.IError>;
  }): ValidationPipe<IOperationMetadata.ISchema, IOperationMetadata.IError> => {
    if (p.result.success === false)
      return {
        success: false,
        errors: p.result.errors.map((e) => ({
          name: e.name,
          accessor:
            e.explore.object !== null
              ? join({
                  object: e.explore.object,
                  key: e.explore.property,
                })
              : null,
          messages: e.messages,
        })),
      };
    const visited: Set<string> = iterateVisited(p.result.data);
    return {
      success: true,
      data: {
        components: {
          objects: p.collection
            .objects()
            .filter((o) => visited.has(o.name))
            .map((o) => o.toJSON()),
          aliases: p.collection
            .aliases()
            .filter((a) => visited.has(a.name))
            .map((a) => a.toJSON()),
          arrays: p.collection
            .arrays()
            .filter((a) => visited.has(a.name))
            .map((a) => a.toJSON()),
          tuples: p.collection
            .tuples()
            .filter((t) => visited.has(t.name))
            .map((t) => t.toJSON()),
        },
        metadata: p.result.data.toJSON(),
      },
    };
  };
}

const iterateVisited = (metadata: Metadata): Set<string> => {
  const names: Set<string> = new Set();
  MetadataUtil.visit((m) => {
    for (const alias of m.aliases) names.add(alias.type.name);
    for (const array of m.arrays) names.add(array.type.name);
    for (const tuple of m.tuples) names.add(tuple.type.name);
    for (const object of m.objects) names.add(object.type.name);
  })(metadata);
  return names;
};

const join = ({
  object,
  key,
}: {
  object: MetadataObjectType;
  key: string | object | null;
}) => {
  if (key === null) return object.name;
  else if (typeof key === "object") return `${object.name}[key]`;
  else if (Escaper.variable(key)) return `${object.name}.${key}`;
  return `${object.name}[${JSON.stringify(key)}]`;
};

const escapePromise = (node: ts.TypeNode): ts.TypeNode | null => {
  if (ts.isTypeReferenceNode(node)) {
    const typeName: string = node.typeName.getText();
    if (typeName === "Promise") return node.typeArguments?.[0] ?? null;
  }
  return node;
};
