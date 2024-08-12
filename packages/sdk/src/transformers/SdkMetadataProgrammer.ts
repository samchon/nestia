import ts from "typescript";
import { CommentFactory } from "typia/lib/factories/CommentFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";
import { ValidationPipe } from "typia/lib/typings/ValidationPipe";
import { Escaper } from "typia/lib/utils/Escaper";

import { ImportAnalyzer } from "../analyses/ImportAnalyzer";
import { IOperationMetadata } from "./IOperationMetadata";
import { ISdkTransformerContext } from "./ISdkTransformerContext";

export namespace SdkMetadataProgrammer {
  export interface IProps {
    context: ISdkTransformerContext;
    generics: WeakMap<ts.Type, ts.Type>;
    node: ts.MethodDeclaration;
  }
  export const write = (p: IProps): IOperationMetadata => {
    const symbol: ts.Symbol | undefined = p.context.checker.getSymbolAtLocation(
      p.node,
    );
    const signature: ts.Signature | undefined =
      p.context.checker.getSignatureFromDeclaration(p.node);
    return {
      parameters: p.node.parameters.map((parameter, index) =>
        writeParameter({
          context: p.context,
          generics: p.generics,
          parameter,
          index,
        }),
      ),
      success: writeResponse({
        context: p.context,
        generics: p.generics,
        type: getReturnType({
          checker: p.context.checker,
          signature,
        }),
      }),
      exceptions: {}, // @todo
      description: (symbol && CommentFactory.description(symbol)) ?? null,
      jsDocTags: signature?.getJsDocTags() ?? [],
    };
  };

  const writeParameter = (props: {
    context: ISdkTransformerContext;
    generics: WeakMap<ts.Type, ts.Type>;
    parameter: ts.ParameterDeclaration;
    index: number;
  }): IOperationMetadata.IParameter => {
    const symbol: ts.Symbol | undefined =
      props.context.checker.getSymbolAtLocation(props.parameter);
    return {
      ...writeType({
        ...props,
        type:
          props.context.checker.getTypeFromTypeNode(
            props.parameter.type ?? TypeFactory.keyword("any"),
          ) ?? null,
        required: props.parameter.questionToken === undefined,
      }),
      name: props.parameter.name.getText(),
      index: props.index,
      description: (symbol && CommentFactory.description(symbol)) ?? null,
      jsDocTags: symbol?.getJsDocTags() ?? [],
    };
  };

  const writeResponse = (props: {
    context: ISdkTransformerContext;
    generics: WeakMap<ts.Type, ts.Type>;
    type: ts.Type | null;
  }): IOperationMetadata.IResponse =>
    writeType({
      ...props,
      required: true,
    });

  const writeType = (p: {
    context: ISdkTransformerContext;
    generics: WeakMap<ts.Type, ts.Type>;
    type: ts.Type | null;
    required: boolean;
  }): IOperationMetadata.IResponse => {
    const analyzed: ImportAnalyzer.IOutput = p.type
      ? ImportAnalyzer.analyze(p.context.checker, p.generics, p.type)
      : {
          type: { name: "any" },
          imports: [],
        };
    const [primitive, resolved] = [true, false].map((escape) =>
      MetadataFactory.analyze(
        p.context.checker,
        p.context.api,
      )({
        escape,
        constant: true,
        absorb: true,
      })(p.context.collection)(p.type),
    );
    return {
      ...analyzed,
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

  const getReturnType = (p: {
    checker: ts.TypeChecker;
    signature: ts.Signature | undefined;
  }): ts.Type | null => {
    const type: ts.Type | null = p.signature?.getReturnType() ?? null;
    if (type === null) return null;
    else if (type.symbol?.name === "Promise") {
      const generic: readonly ts.Type[] = p.checker.getTypeArguments(
        type as ts.TypeReference,
      );
      return generic[0] ?? null;
    }
    return type;
  };
}

const iterateVisited = (metdata: Metadata): Set<string> => {
  const names: Set<string> = new Set();
  const visited: WeakSet<Metadata> = new WeakSet();
  const iterate = (metadata: Metadata): void => {
    if (visited.has(metadata)) return;
    visited.add(metadata);
    for (const alias of metadata.aliases) {
      names.add(alias.name);
      iterate(alias.value);
    }
    for (const array of metadata.arrays) {
      names.add(array.type.name);
      iterate(array.type.value);
    }
    for (const tuple of metadata.tuples) {
      names.add(tuple.type.name);
      tuple.type.elements.map(iterate);
    }
    for (const object of metadata.objects) {
      names.add(object.name);
      object.properties.map((p) => {
        iterate(p.key);
        iterate(p.value);
      });
    }
    if (metadata.escaped) {
      iterate(metadata.escaped.original);
      iterate(metadata.escaped.returns);
    }
    if (metadata.rest) iterate(metadata.rest);
  };
  iterate(metdata);
  return names;
};

const join = ({
  object,
  key,
}: {
  object: MetadataObject;
  key: string | object | null;
}) => {
  if (key === null) return object.name;
  else if (typeof key === "object") return `${object.name}[key]`;
  else if (Escaper.variable(key)) return `${object.name}.${key}`;
  return `${object.name}[${JSON.stringify(key)}]`;
};
