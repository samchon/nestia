import ts from "typescript";
import { CommentFactory } from "typia/lib/factories/CommentFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { ImportAnalyzer } from "../analyses/ImportAnalyzer";
import { IOperationMetadata } from "../structures/IOperationMetadata";
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
  }): IOperationMetadata.IParameter => ({
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
  });

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
    const result = MetadataFactory.analyze(
      p.context.checker,
      p.context.api,
    )({
      escape: true,
      constant: true,
      absorb: false,
    })(p.context.collection)(p.type);
    if (result.success === false) result.errors;
    const analyzed: ImportAnalyzer.IOutput = p.type
      ? ImportAnalyzer.analyze(p.context.checker, p.generics, p.type)
      : {
          type: { name: "any" },
          imports: [],
        };
    return {
      ...analyzed,
      ...(result.success
        ? {
            ...writeSchema({
              collection: p.context.collection,
              metadata: result.data,
            }),
            errors: [],
          }
        : {
            schema: null,
            components: {
              objects: [],
              arrays: [],
              tuples: [],
              aliases: [],
            } satisfies IMetadataComponents,
            errors: result.errors,
          }),
      required: !(
        p.required === false ||
        (result.success && result.data.isRequired() === false)
      ),
    };
  };

  const writeSchema = (p: {
    collection: MetadataCollection;
    metadata: Metadata;
  }): {
    components: IMetadataComponents;
    schema: IMetadata;
  } => {
    const visited: Set<string> = iterateVisited(p.metadata);
    return {
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
      schema: p.metadata.toJSON(),
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
