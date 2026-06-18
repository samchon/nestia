import { SyntaxKind, type TypeNode, factory } from "@ttsc/factory";
import { NamingConvention } from "@typia/utils";
import { IJsDocTagInfo, IMetadataTypeTag } from "typia";

import { ExpressionFactory } from "../../factories/ExpressionFactory";
import { TypeFactory } from "../../factories/TypeFactory";
import {
  MetadataAliasType,
  MetadataArray,
  MetadataAtomic,
  MetadataConstantValue,
  MetadataEscaped,
  MetadataObjectType,
  MetadataProperty,
  MetadataSchema,
  MetadataTuple,
  isSoleLiteralOf,
  sizeOf,
} from "../../internal/legacy";
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
    (meta: MetadataSchema, parentEscaped: boolean = false): TypeNode => {
      const union: TypeNode[] = [];

      // COALESCES
      if (meta.any) union.push(TypeFactory.keyword("any"));
      if (meta.nullable) union.push(writeNode("null"));
      if (meta.required === false) union.push(writeNode("undefined"));
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
        union.push(write_tuple(project)(importer)(tuple as MetadataTuple));
      for (const array of meta.arrays)
        union.push(write_array(project)(importer)(array as MetadataArray));
      for (const object of meta.objects) {
        const target = object.type as MetadataObjectType;
        if (
          target.name === "object" ||
          target.name === "__type" ||
          target.name.startsWith("__type.") ||
          target.name === "__object" ||
          target.name.startsWith("__object.")
        )
          union.push(write_object(project)(importer)(target));
        else union.push(writeAlias(project)(importer)(target));
      }
      for (const alias of meta.aliases)
        union.push(
          writeAlias(project)(importer)(alias.type as MetadataAliasType),
        );
      for (const native of meta.natives)
        if (native.name === "Blob" || native.name === "File")
          union.push(write_native(native.name));

      return union.length === 1
        ? union[0]!
        : factory.createUnionTypeNode(union);
    };

  export const write_object =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (object: MetadataObjectType): TypeNode => {
      const regular = object.properties.filter((p) => isSoleLiteralOf(p.key));
      const dynamic = object.properties.filter((p) => !isSoleLiteralOf(p.key));
      return regular.length && dynamic.length
        ? factory.createIntersectionTypeNode([
            write_regular_property(project)(importer)(regular),
            ...dynamic.map(write_dynamic_property(project)(importer)),
          ])
        : dynamic.length
          ? factory.createIntersectionTypeNode(
              dynamic.map(write_dynamic_property(project)(importer)),
            )
          : write_regular_property(project)(importer)(regular);
    };

  const write_escaped =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataEscaped): TypeNode => {
      if (
        sizeOf(meta.original) === 1 &&
        meta.original.natives.length === 1 &&
        meta.original.natives[0]!.name === "Date"
      )
        return factory.createIntersectionTypeNode([
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
      return factory.createLiteralTypeNode(
        value.value ? factory.createTrue() : factory.createFalse(),
      );
    else if (typeof value.value === "bigint")
      return factory.createLiteralTypeNode(
        value.value < BigInt(0)
          ? factory.createPrefixUnaryExpression(
              SyntaxKind.MinusToken,
              factory.createBigIntLiteral((-value.value).toString()),
            )
          : factory.createBigIntLiteral(value.value.toString()),
      );
    else if (typeof value.value === "number")
      return factory.createLiteralTypeNode(
        ExpressionFactory.number(value.value),
      );
    return factory.createLiteralTypeNode(
      factory.createStringLiteral(value.value as string),
    );
  };

  const write_template =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataSchema[]): TypeNode => {
      const head: boolean = isSoleLiteralOf(meta[0]!);
      const spans: [TypeNode | null, string | null][] = [];
      for (const elem of meta.slice(head ? 1 : 0)) {
        const last =
          spans.at(-1) ??
          (() => {
            const tuple = [null!, null!] as [TypeNode | null, string | null];
            spans.push(tuple);
            return tuple;
          })();
        if (isSoleLiteralOf(elem))
          if (last[1] === null)
            last[1] = String(elem.constants[0]!.values[0]!.value);
          else
            spans.push([
              factory.createLiteralTypeNode(
                factory.createStringLiteral(
                  String(elem.constants[0]!.values[0]!.value),
                ),
              ),
              null,
            ]);
        else if (last[0] === null) last[0] = write(project)(importer)(elem);
        else spans.push([write(project)(importer)(elem), null]);
      }
      return factory.createTemplateLiteralType(
        factory.createTemplateHead(
          head ? (meta[0]!.constants[0]!.values[0]!.value as string) : "",
        ),
        spans
          .filter(([node]) => node !== null)
          .map(([node, str], i, array) =>
            factory.createTemplateLiteralTypeSpan(
              node!,
              (i !== array.length - 1
                ? factory.createTemplateMiddle
                : factory.createTemplateTail)(str ?? ""),
            ),
          ),
      );
    };

  const write_atomic =
    (importer: ImportDictionary) =>
    (meta: MetadataAtomic): TypeNode =>
      write_type_tag_matrix(importer)(
        meta.type as "boolean" | "bigint" | "number" | "string",
        factory.createKeywordTypeNode(
          meta.type === "boolean"
            ? SyntaxKind.BooleanKeyword
            : meta.type === "bigint"
              ? SyntaxKind.BigIntKeyword
              : meta.type === "number"
                ? SyntaxKind.NumberKeyword
                : SyntaxKind.StringKeyword,
        ),
        meta.tags,
      );

  /* -----------------------------------------------------------
    INSTANCES
  ----------------------------------------------------------- */
  const write_array =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataArray): TypeNode =>
      write_type_tag_matrix(importer)(
        "array",
        factory.createArrayTypeNode(write(project)(importer)(meta.type!.value)),
        meta.tags,
      );

  const write_tuple =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataTuple): TypeNode =>
      factory.createTupleTypeNode(
        meta.type!.elements.map((elem) =>
          elem.rest
            ? factory.createRestTypeNode(
                factory.createArrayTypeNode(
                  write(project)(importer)(elem.rest),
                ),
              )
            : elem.optional
              ? factory.createOptionalTypeNode(write(project)(importer)(elem))
              : write(project)(importer)(elem),
        ),
      );

  const write_regular_property =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (properties: MetadataProperty[]): TypeNode =>
      factory.createTypeLiteralNode(
        properties
          .map((p) => {
            const description: string = writeComment(p.value.atomics)(
              p.description,
              p.jsDocTags,
            );
            const signature = factory.createPropertySignature(
              undefined,
              NamingConvention.variable(
                String(p.key.constants[0]!.values[0]!.value),
              )
                ? factory.createIdentifier(
                    String(p.key.constants[0]!.values[0]!.value),
                  )
                : factory.createStringLiteral(
                    String(p.key.constants[0]!.values[0]!.value),
                  ),
              p.value.required === false
                ? factory.createToken(SyntaxKind.QuestionToken)
                : undefined,
              SdkTypeProgrammer.write(project)(importer)(p.value),
            );
            return !!description.length
              ? [
                  factory.createIdentifier("\n") as any,
                  FilePrinter.description(signature, description),
                ]
              : signature;
          })
          .flat(),
      );

  const write_dynamic_property =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (property: MetadataProperty): TypeNode =>
      factory.createTypeLiteralNode([
        FilePrinter.description(
          factory.createIndexSignature(
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                factory.createIdentifier("key"),
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
    (meta: MetadataAliasType | MetadataObjectType): TypeNode => {
      importInternalFile(project)(importer)(meta.name);
      return factory.createTypeReferenceNode(meta.name);
    };

  const write_native = (name: string): TypeNode =>
    factory.createTypeReferenceNode(name);

  /* -----------------------------------------------------------
    MISCELLANEOUS
  ----------------------------------------------------------- */
  const write_type_tag_matrix =
    (importer: ImportDictionary) =>
    (
      from: "array" | "boolean" | "number" | "bigint" | "string" | "object",
      base: TypeNode,
      matrix: IMetadataTypeTag[][],
    ): TypeNode => {
      matrix = matrix.filter((row) => row.length !== 0);
      if (matrix.length === 0) return base;
      else if (matrix.length === 1)
        return factory.createIntersectionTypeNode([
          base,
          ...matrix[0]!.map((tag) =>
            SdkTypeTagProgrammer.write(importer, from, tag),
          ),
        ]);
      return factory.createIntersectionTypeNode([
        base,
        factory.createUnionTypeNode(
          matrix.map((row) =>
            row.length === 1
              ? SdkTypeTagProgrammer.write(importer, from, row[0]!)
              : factory.createIntersectionTypeNode(
                  row.map((tag) =>
                    SdkTypeTagProgrammer.write(importer, from, tag),
                  ),
                ),
          ),
        ),
      ]);
    };
}

const writeNode = (text: string) => factory.createTypeReferenceNode(text);
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
    const top: string = name.split(".")[0]!;
    if (importer.file === `${project.config.output}/structures/${top}.ts`)
      return;
    importer.internal({
      declaration: true,
      file: `${project.config.output}/structures/${name.split(".")[0]}`,
      type: "element",
      name: top,
    });
  };
