import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { IMetadataTypeTag } from "typia/lib/schemas/metadata/IMetadataTypeTag";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataAlias } from "typia/lib/schemas/metadata/MetadataAlias";
import { MetadataArray } from "typia/lib/schemas/metadata/MetadataArray";
import { MetadataAtomic } from "typia/lib/schemas/metadata/MetadataAtomic";
import { MetadataEscaped } from "typia/lib/schemas/metadata/MetadataEscaped";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";
import { MetadataTuple } from "typia/lib/schemas/metadata/MetadataTuple";

import { INestiaConfig } from "../../INestiaConfig";
import { ImportDictionary } from "../../utils/ImportDictionary";

export namespace SdkTypeProgrammer {
  export const decode =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (meta: Metadata, parentEscaped: boolean = false): ts.TypeNode => {
      const union: ts.TypeNode[] = [];

      // COALESCES
      if (meta.any) union.push(TypeFactory.keyword("any"));
      if (meta.nullable) union.push(node("null"));
      if (meta.isRequired() === false) union.push(node("undefined"));
      if (parentEscaped === false && meta.escaped)
        union.push(decode_escaped(config)(importer)(meta.escaped));

      // ATOMIC TYPES
      for (const c of meta.constants)
        for (const value of c.values) union.push(decode_constant(value));
      for (const tpl of meta.templates)
        union.push(decode_template(config)(importer)(tpl));
      for (const atom of meta.atomics)
        union.push(decode_atomic(importer)(atom));

      // OBJECT TYPES
      for (const tuple of meta.tuples)
        union.push(decode_tuple(config)(importer)(tuple));
      for (const array of meta.arrays)
        union.push(decode_array(config)(importer)(array));
      for (const object of meta.objects)
        union.push(decode_alias(config)(importer)(object));
      for (const alias of meta.aliases)
        union.push(decode_alias(config)(importer)(alias));

      return union.length === 1
        ? union[0]
        : ts.factory.createUnionTypeNode(union);
    };

  const decode_escaped =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (meta: MetadataEscaped): ts.TypeNode => {
      if (
        meta.original.size() === 1 &&
        meta.original.natives.length === 1 &&
        meta.original.natives[0] === "Date"
      )
        return ts.factory.createIntersectionTypeNode([
          TypeFactory.keyword("string"),
          decodeTag(importer)({
            name: "Format",
            value: "date-time",
          } as IMetadataTypeTag),
        ]);
      return decode(config)(importer)(meta.returns, true);
    };

  const decode_constant = (value: boolean | bigint | number | string) => {
    if (typeof value === "boolean")
      return ts.factory.createLiteralTypeNode(
        value ? ts.factory.createTrue() : ts.factory.createFalse(),
      );
    else if (typeof value === "bigint")
      return ts.factory.createLiteralTypeNode(
        value < BigInt(0)
          ? ts.factory.createPrefixUnaryExpression(
              ts.SyntaxKind.MinusToken,
              ts.factory.createBigIntLiteral((-value).toString()),
            )
          : ts.factory.createBigIntLiteral(value.toString()),
      );
    else if (typeof value === "number")
      return ts.factory.createLiteralTypeNode(ExpressionFactory.number(value));
    return ts.factory.createLiteralTypeNode(
      ts.factory.createStringLiteral(value),
    );
  };

  const decode_template =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (meta: Metadata[]): ts.TypeNode => {
      const head: boolean = meta[0].isSoleLiteral();
      const spans: [ts.TypeNode | null, string | null][] = [];
      for (const elem of meta.slice(head ? 1 : 0)) {
        const last =
          spans.at(-1) ??
          (() => {
            const tuple = [null!, null!] as [ts.TypeNode | null, string | null];
            spans.push(tuple);
            return tuple;
          })();
        if (elem.isSoleLiteral())
          if (last[1] === null) last[1] = String(elem.constants[0].values[0]);
          else
            spans.push([
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(
                  String(elem.constants[0].values[0]),
                ),
              ),
              null,
            ]);
        else if (last[0] === null) last[0] = decode(config)(importer)(elem);
        else spans.push([decode(config)(importer)(elem), null]);
      }
      return ts.factory.createTemplateLiteralType(
        ts.factory.createTemplateHead(
          head ? (meta[0].constants[0].values[0] as string) : "",
        ),
        spans
          .filter(([node]) => node !== null)
          .map(([node, str], i, array) =>
            ts.factory.createTemplateLiteralTypeSpan(
              node!,
              (i !== array.length - 1
                ? ts.factory.createTemplateMiddle
                : ts.factory.createTemplateTail)(str ?? ""),
            ),
          ),
      );
    };

  const decode_atomic =
    (importer: ImportDictionary) =>
    (meta: MetadataAtomic): ts.TypeNode =>
      decode_type_tag_matrix(importer)(
        ts.factory.createKeywordTypeNode(
          meta.type === "boolean"
            ? ts.SyntaxKind.BooleanKeyword
            : meta.type === "bigint"
              ? ts.SyntaxKind.BigIntKeyword
              : meta.type === "number"
                ? ts.SyntaxKind.NumberKeyword
                : ts.SyntaxKind.StringKeyword,
        ),
        meta.tags,
      );

  const decode_array =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (meta: MetadataArray): ts.TypeNode =>
      decode_type_tag_matrix(importer)(
        ts.factory.createArrayTypeNode(
          decode(config)(importer)(meta.type.value),
        ),
        meta.tags,
      );

  const decode_tuple =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (meta: MetadataTuple): ts.TypeNode =>
      ts.factory.createTupleTypeNode(
        meta.type.elements.map((elem) =>
          elem.rest
            ? ts.factory.createRestTypeNode(
                ts.factory.createArrayTypeNode(
                  decode(config)(importer)(elem.rest),
                ),
              )
            : decode(config)(importer)(elem),
        ),
      );

  const decode_alias =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (meta: MetadataAlias | MetadataObject): ts.TypeNode => {
      importInternalFile(config)(importer)(meta.name);
      return ts.factory.createTypeReferenceNode(meta.name);
    };

  const decode_type_tag_matrix =
    (importer: ImportDictionary) =>
    (base: ts.TypeNode, matrix: IMetadataTypeTag[][]): ts.TypeNode => {
      matrix = matrix.filter((row) => row.length !== 0);
      if (matrix.length === 0) return base;
      else if (matrix.length === 1)
        return ts.factory.createIntersectionTypeNode([
          base,
          ...matrix[0].map((tag) => decodeTag(importer)(tag)),
        ]);
      return ts.factory.createIntersectionTypeNode([
        base,
        ts.factory.createUnionTypeNode(
          matrix.map((row) =>
            row.length === 1
              ? decodeTag(importer)(row[0])
              : ts.factory.createIntersectionTypeNode(
                  row.map((tag) => decodeTag(importer)(tag)),
                ),
          ),
        ),
      ]);
    };
}

const node = (text: string) => ts.factory.createTypeReferenceNode(text);
const decodeTag = (importer: ImportDictionary) => (tag: IMetadataTypeTag) => {
  const instance: string = tag.name.split("<")[0];
  return ts.factory.createTypeReferenceNode(
    importer.external({
      type: true,
      library: `typia/lib/tags/${instance}`,
      instance,
    }),
    [
      ts.factory.createLiteralTypeNode(
        typeof tag.value === "boolean"
          ? tag.value
            ? ts.factory.createTrue()
            : ts.factory.createFalse()
          : typeof tag.value === "bigint"
            ? tag.value < BigInt(0)
              ? ts.factory.createPrefixUnaryExpression(
                  ts.SyntaxKind.MinusToken,
                  ts.factory.createBigIntLiteral((-tag.value).toString()),
                )
              : ts.factory.createBigIntLiteral(tag.value.toString())
            : typeof tag.value === "number"
              ? ExpressionFactory.number(tag.value)
              : ts.factory.createStringLiteral(tag.value),
      ),
    ],
  );
};
const importInternalFile =
  (config: INestiaConfig) => (importer: ImportDictionary) => (name: string) => {
    const top = name.split(".")[0];
    if (importer.file === `${config.output}/structures/${top}.ts`) return;
    importer.internal({
      type: true,
      file: `${config.output}/structures/${name.split(".")[0]}`,
      instance: top,
    });
  };
