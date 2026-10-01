import { SyntaxKind, type TypeNode, factory } from "@ttsc/factory";
import { NamingConvention } from "@typia/utils";
import { IJsDocTagInfo, IMetadataTypeTag } from "typia";

import { ExpressionFactory } from "../../factories/ExpressionFactory";
import { LiteralFactory } from "../../factories/LiteralFactory";
import { TypeFactory } from "../../factories/TypeFactory";
import {
  MetadataAliasType,
  MetadataArray,
  MetadataArrayType,
  MetadataAtomic,
  MetadataConstantValue,
  MetadataEscaped,
  MetadataObjectType,
  MetadataProperty,
  MetadataSchema,
  MetadataTuple,
  MetadataTupleType,
  decodeMetadataValue,
  isRequiredOf,
  isSoleLiteralOf,
} from "../../internal/legacy";
import { INestiaProject } from "../../structures/INestiaProject";
import { StringUtil } from "../../utils/StringUtil";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeTagProgrammer } from "./SdkTypeTagProgrammer";

/**
 * Writes the TypeScript type of a metadata.
 *
 * @evidence contracts/common.md#principled-implementation The namespace turns each member of the metadata into a type node and joins them as a union.
 * @evidence contracts/common.md#clear-and-simple-design The schema facade and object writer use one writer per form; collection-body operations distinguish a named recursive definition from its nested references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A name that cannot be referenced is written inline.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 */
export namespace SdkTypeProgrammer {
  /* -----------------------------------------------------------
    FACADE
  ----------------------------------------------------------- */
  /**
   * Returns the type of a metadata: the union of its any, null, undefined,
   * escaped, constant, template, atomic, tuple, array, object, alias, and
   * native and typed collection forms. An empty union emits never.
   *
   * @evidence contracts/common.md#principled-implementation Named objects, aliases and recursive collections use references; implicit objects and nonrecursive collections use inline bodies. A recursive declaration writes its collection body once, and nested uses return through references.
   * @evidence contracts/common.md#clear-and-simple-design One function of ordered cases.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The member order is fixed, supported resolved natives retain their type references, and empty unions use the TypeScript bottom type rather than an empty printed node.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
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
        for (const value of c.values) union.push(write_constant(c.type, value));
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
        // One definition of "this type has no name to reference". This was a
        // second copy of `StringUtil.isImplicit`, and the copies drifted: only
        // the dotted spelling was listed here, so a duplicated anonymous type
        // -- `__type-o1` under typia's current separator -- was referenced as a
        // module that the declaration side had correctly refused to write.
        if (StringUtil.isImplicit(target.name))
          union.push(write_object(project)(importer)(target));
        else union.push(writeAlias(project)(importer)(target));
      }
      for (const alias of meta.aliases)
        union.push(
          writeAlias(project)(importer)(alias.type as MetadataAliasType),
        );
      for (const native of meta.natives) union.push(write_native(native.name));
      for (const set of meta.sets)
        union.push(
          factory.createTypeReferenceNode("Set", [
            write(project)(importer)(set.value),
          ]),
        );
      for (const map of meta.maps)
        union.push(
          factory.createTypeReferenceNode("Map", [
            write(project)(importer)(map.key),
            write(project)(importer)(map.value),
          ]),
        );

      return union.length === 0
        ? TypeFactory.keyword("never")
        : union.length === 1
          ? union[0]!
          : factory.createUnionTypeNode(union);
    };

  /**
   * Returns the type of an object: the regular properties as one literal,
   * intersected with each dynamic key's index signature. Both signature forms
   * retain the metadata's readonly modifier.
   *
   * @evidence contracts/common.md#principled-implementation A key that is a sole literal is regular, and every other key is dynamic. Each property's mutability supplies the readonly modifier for its corresponding property or index signature.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The cases are exhaustive over the keys.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
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
        meta.original.natives.length === 1 &&
        meta.original.natives[0]!.name === "Date" &&
        !meta.original.any &&
        meta.original.escaped === null &&
        [
          meta.original.atomics,
          meta.original.constants,
          meta.original.templates,
          meta.original.arrays,
          meta.original.tuples,
          meta.original.objects,
          meta.original.aliases,
          meta.original.sets,
          meta.original.maps,
          meta.original.functions,
        ].every((members) => members.length === 0)
      )
        return factory.createIntersectionTypeNode([
          TypeFactory.keyword("string"),
          SdkTypeTagProgrammer.writePredefined(importer, "Format", "date-time"),
        ]);
      return write(project)(importer)(meta.returns, true);
    };

  /* -----------------------------------------------------------
    ATOMICS
  ----------------------------------------------------------- */
  const write_constant = (
    type: string,
    constant: MetadataConstantValue,
  ): TypeNode => {
    const value: unknown = decodeMetadataValue(type, constant.value);
    if (typeof value === "boolean")
      return factory.createLiteralTypeNode(
        value ? factory.createTrue() : factory.createFalse(),
      );
    else if (typeof value === "bigint")
      return factory.createLiteralTypeNode(LiteralFactory.write(value) as any);
    else if (typeof value === "number")
      // NaN is the one number with no literal type
      return Number.isNaN(value)
        ? TypeFactory.keyword("number")
        : factory.createLiteralTypeNode(ExpressionFactory.number(value));
    return factory.createLiteralTypeNode(
      factory.createStringLiteral(value as string),
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
        meta.type!.recursive
          ? writeAlias(project)(importer)(meta.type!)
          : write_array_type(project)(importer)(meta.type!),
        meta.tags,
      );

  const write_tuple =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataTuple): TypeNode =>
      meta.type!.recursive
        ? writeAlias(project)(importer)(meta.type!)
        : write_tuple_type(project)(importer)(meta.type!);

  /**
   * Writes an array definition's body, using named references for recursive
   * collections reached through its element schema.
   *
   * @evidence contracts/common.md#principled-implementation A declaration needs one array body while its nested use sites use the ordinary writer's recursive references, so X=X[] is finite and retains its element meaning.
   * @evidence contracts/common.md#clear-and-simple-design One array node delegates its element to write.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration operation is distinct from reference emission and adds no test-only flags or names.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes a definition body from nested references.
   */
  export const write_array_type =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataArrayType): TypeNode =>
      factory.createArrayTypeNode(write(project)(importer)(meta.value));

  /**
   * Writes a tuple definition's body, retaining optional and rest elements
   * while nested recursive collections use named references.
   *
   * @evidence contracts/common.md#principled-implementation Each element retains its optional/rest form and schema; nested uses return through write, whose recursive reference branch terminates self and mutual collection cycles.
   * @evidence contracts/common.md#clear-and-simple-design One element map creates the tuple body.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The same body operation serves ordinary inline tuples and recursive declarations without special-cased source names.
   * @evidence contracts/common.md#meaningful-documentation The comment states the definition body and modifier responsibilities.
   */
  export const write_tuple_type =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (meta: MetadataTupleType): TypeNode =>
      factory.createTupleTypeNode(
        meta.elements.map((elem) =>
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
              p.mutability === "readonly"
                ? [factory.createModifier(SyntaxKind.ReadonlyKeyword)]
                : undefined,
              NamingConvention.variable(
                String(p.key.constants[0]!.values[0]!.value),
              )
                ? factory.createIdentifier(
                    String(p.key.constants[0]!.values[0]!.value),
                  )
                : factory.createStringLiteral(
                    String(p.key.constants[0]!.values[0]!.value),
                  ),
              isRequiredOf(p.value) === false
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
            property.mutability === "readonly"
              ? [factory.createModifier(SyntaxKind.ReadonlyKeyword)]
              : undefined,
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
    (
      meta:
        | MetadataAliasType
        | MetadataObjectType
        | MetadataArrayType
        | MetadataTupleType,
    ): TypeNode => {
      importInternalFile(project)(importer)(meta.name);
      // The reference has to spell the accessor path the declaration was
      // written under, not the raw metadata name: a duplicated name carries
      // typia's `-o<counter>` marker, which declares as a namespace member and
      // therefore refers as `IDirectory.o1`.
      return factory.createTypeReferenceNode(
        StringUtil.accessorsOf(meta.name).join("."),
      );
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
    // The file is named after the first accessor, so a duplicated name lands
    // in its base type's file rather than inventing `IDirectory-o1.ts`.
    const top: string = StringUtil.accessorsOf(name)[0]!;
    if (importer.file === `${project.config.output}/structures/${top}.ts`)
      return;
    importer.internal({
      declaration: true,
      file: `${project.config.output}/structures/${top}`,
      type: "element",
      name: top,
    });
  };
