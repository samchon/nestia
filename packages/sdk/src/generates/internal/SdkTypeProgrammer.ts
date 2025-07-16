import ts from "typescript";
import { IJsDocTagInfo } from "typia";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { IMetadataTypeTag } from "typia/lib/schemas/metadata/IMetadataTypeTag";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { MetadataAliasType } from "typia/lib/schemas/metadata/MetadataAliasType";
import { MetadataArray } from "typia/lib/schemas/metadata/MetadataArray";
import { MetadataAtomic } from "typia/lib/schemas/metadata/MetadataAtomic";
import { MetadataConstantValue } from "typia/lib/schemas/metadata/MetadataConstantValue";
import { MetadataEscaped } from "typia/lib/schemas/metadata/MetadataEscaped";
import { MetadataObjectType } from "typia/lib/schemas/metadata/MetadataObjectType";
import { MetadataProperty } from "typia/lib/schemas/metadata/MetadataProperty";
import { MetadataTuple } from "typia/lib/schemas/metadata/MetadataTuple";
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaProject } from "../../structures/INestiaProject";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeTagProgrammer } from "./SdkTypeTagProgrammer";

export namespace SdkTypeProgrammer {
  /* -----------------------------------------------------------
    FACADE
  ----------------------------------------------------------- */
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: Metadata, parentEscaped: boolean = false): ts.TypeNode => {
      const union: ts.TypeNode[] = [];

      // COALESCES
      if (meta.any) union.push(TypeFactory.keyword("any"));
      if (meta.nullable) union.push(writeNode("null"));
      if (meta.isRequired() === false) union.push(writeNode("undefined"));
      if (parentEscaped === false && meta.escaped)
        union.push(write_escaped(project)(importer)(meta.escaped));

      // ATOMIC TYPES
      for (const c of meta.constants)
        for (const value of c.values) union.push(write_constant(value));
      for (const tpl of meta.templates)
        union.push(write_template(project)(importer)(tpl.row ?? tpl));
      for (const atom of meta.atomics) union.push(write_atomic(importer)(atom));

      // OBJECT TYPES
      for (const tuple of meta.tuples)
        union.push(write_tuple(project)(importer)(tuple));
      for (const array of meta.arrays)
        union.push(write_array(project)(importer)(array));
      for (const object of meta.objects)
        if (
          object.type.name === "object" ||
          object.type.name === "__type" ||
          object.type.name.startsWith("__type.") ||
          object.type.name === "__object" ||
          object.type.name.startsWith("__object.")
        )
          union.push(write_object(project)(importer)(object.type));
        else union.push(writeAlias(project)(importer)(object.type));
      for (const alias of meta.aliases)
        union.push(writeAlias(project)(importer)(alias.type));
      for (const native of meta.natives)
        if (native.name === "Blob" || native.name === "File")
          union.push(write_native(native.name));

      return union.length === 1
        ? union[0]
        : ts.factory.createUnionTypeNode(union);
    };

  export const write_object =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (object: MetadataObjectType): ts.TypeNode => {
      const regular = object.properties.filter((p) => p.key.isSoleLiteral());
      const dynamic = object.properties.filter((p) => !p.key.isSoleLiteral());
      return regular.length && dynamic.length
        ? ts.factory.createIntersectionTypeNode([
            write_regular_property(project)(importer)(regular),
            ...dynamic.map(write_dynamic_property(project)(importer)),
          ])
        : dynamic.length
          ? ts.factory.createIntersectionTypeNode(
              dynamic.map(write_dynamic_property(project)(importer)),
            )
          : write_regular_property(project)(importer)(regular);
    };

  const write_escaped =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataEscaped): ts.TypeNode => {
      if (
        meta.original.size() === 1 &&
        meta.original.natives.length === 1 &&
        meta.original.natives[0].name === "Date"
      )
        return ts.factory.createIntersectionTypeNode([
          TypeFactory.keyword("string"),
          SdkTypeTagProgrammer.write(importer, "string", {
            name: "Format",
            value: "date-time",
          } as IMetadataTypeTag),
        ]);
      return write(project)(importer)(meta.returns, true);
    };

  /* -----------------------------------------------------------
    ATOMICS
  ----------------------------------------------------------- */
  const write_constant = (value: MetadataConstantValue) => {
    if (typeof value.value === "boolean")
      return ts.factory.createLiteralTypeNode(
        value ? ts.factory.createTrue() : ts.factory.createFalse(),
      );
    else if (typeof value.value === "bigint")
      return ts.factory.createLiteralTypeNode(
        value.value < BigInt(0)
          ? ts.factory.createPrefixUnaryExpression(
              ts.SyntaxKind.MinusToken,
              ts.factory.createBigIntLiteral((-value).toString()),
            )
          : ts.factory.createBigIntLiteral(value.toString()),
      );
    else if (typeof value.value === "number")
      return ts.factory.createLiteralTypeNode(
        ExpressionFactory.number(value.value),
      );
    return ts.factory.createLiteralTypeNode(
      ts.factory.createStringLiteral(value.value as string),
    );
  };

  const write_template =
    (project: INestiaProject) =>
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
          if (last[1] === null)
            last[1] = String(elem.constants[0].values[0].value);
          else
            spans.push([
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(
                  String(elem.constants[0].values[0].value),
                ),
              ),
              null,
            ]);
        else if (last[0] === null) last[0] = write(project)(importer)(elem);
        else spans.push([write(project)(importer)(elem), null]);
      }
      return ts.factory.createTemplateLiteralType(
        ts.factory.createTemplateHead(
          head ? (meta[0].constants[0].values[0].value as string) : "",
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

  const write_atomic =
    (importer: ImportDictionary) =>
    (meta: MetadataAtomic): ts.TypeNode =>
      write_type_tag_matrix(importer)(
        meta.type as "boolean" | "bigint" | "number" | "string",
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

  /* -----------------------------------------------------------
    INSTANCES
  ----------------------------------------------------------- */
  const write_array =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataArray): ts.TypeNode =>
      write_type_tag_matrix(importer)(
        "array",
        ts.factory.createArrayTypeNode(
          write(project)(importer)(meta.type.value),
        ),
        meta.tags,
      );

  const write_tuple =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataTuple): ts.TypeNode =>
      ts.factory.createTupleTypeNode(
        meta.type.elements.map((elem) =>
          elem.rest
            ? ts.factory.createRestTypeNode(
                ts.factory.createArrayTypeNode(
                  write(project)(importer)(elem.rest),
                ),
              )
            : elem.optional
              ? ts.factory.createOptionalTypeNode(
                  write(project)(importer)(elem),
                )
              : write(project)(importer)(elem),
        ),
      );

  const write_regular_property =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (properties: MetadataProperty[]): ts.TypeLiteralNode =>
      ts.factory.createTypeLiteralNode(
        properties
          .map((p) => {
            const description: string = writeComment(p.value.atomics)(
              p.description,
              p.jsDocTags,
            );
            const signature: ts.PropertySignature =
              ts.factory.createPropertySignature(
                undefined,
                Escaper.variable(String(p.key.constants[0].values[0].value))
                  ? ts.factory.createIdentifier(
                      String(p.key.constants[0].values[0].value),
                    )
                  : ts.factory.createStringLiteral(
                      String(p.key.constants[0].values[0].value),
                    ),
                p.value.isRequired() === false
                  ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                  : undefined,
                SdkTypeProgrammer.write(project)(importer)(p.value),
              );
            return !!description.length
              ? [
                  ts.factory.createIdentifier("\n") as any,
                  FilePrinter.description(signature, description),
                ]
              : signature;
          })
          .flat(),
      );

  const write_dynamic_property =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (property: MetadataProperty): ts.TypeLiteralNode =>
      ts.factory.createTypeLiteralNode([
        FilePrinter.description(
          ts.factory.createIndexSignature(
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier("key"),
                undefined,
                SdkTypeProgrammer.write(project)(importer)(property.key),
              ),
            ],
            SdkTypeProgrammer.write(project)(importer)(property.value),
          ),
          writeComment(property.value.atomics)(
            property.description,
            property.jsDocTags,
          ),
        ),
      ]);

  const writeAlias =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataAliasType | MetadataObjectType): ts.TypeNode => {
      importInternalFile(project)(importer)(meta.name);
      return ts.factory.createTypeReferenceNode(meta.name);
    };

  const write_native = (name: string): ts.TypeNode =>
    ts.factory.createTypeReferenceNode(name);

  /* -----------------------------------------------------------
    MISCELLANEOUS
  ----------------------------------------------------------- */
  const write_type_tag_matrix =
    (importer: ImportDictionary) =>
    (
      from: "array" | "boolean" | "number" | "bigint" | "string" | "object",
      base: ts.TypeNode,
      matrix: IMetadataTypeTag[][],
    ): ts.TypeNode => {
      matrix = matrix.filter((row) => row.length !== 0);
      if (matrix.length === 0) return base;
      else if (matrix.length === 1)
        return ts.factory.createIntersectionTypeNode([
          base,
          ...matrix[0].map((tag) =>
            SdkTypeTagProgrammer.write(importer, from, tag),
          ),
        ]);
      return ts.factory.createIntersectionTypeNode([
        base,
        ts.factory.createUnionTypeNode(
          matrix.map((row) =>
            row.length === 1
              ? SdkTypeTagProgrammer.write(importer, from, row[0])
              : ts.factory.createIntersectionTypeNode(
                  row.map((tag) =>
                    SdkTypeTagProgrammer.write(importer, from, tag),
                  ),
                ),
          ),
        ),
      ]);
    };
}

const writeNode = (text: string) => ts.factory.createTypeReferenceNode(text);
const writeComment =
  (atomics: MetadataAtomic[]) =>
  (description: string | null, jsDocTags: IJsDocTagInfo[]): string => {
    const lines: string[] = [];
    if (description?.length)
      lines.push(...description.split("\n").map((s) => `${s}`));

    const filtered: IJsDocTagInfo[] =
      !!atomics.length && !!jsDocTags?.length
        ? jsDocTags.filter(
            (tag) =>
              !atomics.some((a) =>
                a.tags.some((r) => r.some((t) => t.kind === tag.name)),
              ),
          )
        : (jsDocTags ?? []);

    if (description?.length && filtered.length) lines.push("");
    if (filtered.length)
      lines.push(
        ...filtered.map((t) =>
          t.text?.length
            ? `@${t.name} ${t.text.map((e) => e.text).join("")}`
            : `@${t.name}`,
        ),
      );
    return lines.join("\n");
  };

const importInternalFile =
  (project: INestiaProject) =>
  (importer: ImportDictionary) =>
  (name: string) => {
    const top = name.split(".")[0];
    if (importer.file === `${project.config.output}/structures/${top}.ts`)
      return;
    importer.internal({
      declaration: true,
      file: `${project.config.output}/structures/${name.split(".")[0]}`,
      type: "element",
      name: top,
    });
  };
