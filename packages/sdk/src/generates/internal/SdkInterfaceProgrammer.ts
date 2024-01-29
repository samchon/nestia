import { IPointer } from "tstl";
import ts from "typescript";
import { IJsDocTagInfo } from "typia";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { MetadataAlias } from "typia/lib/schemas/metadata/MetadataAlias";
import { MetadataAtomic } from "typia/lib/schemas/metadata/MetadataAtomic";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";
import { MetadataProperty } from "typia/lib/schemas/metadata/MetadataProperty";
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { FormatUtil } from "../../utils/FormatUtil";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { MapUtil } from "../../utils/MapUtil";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkInterfaceProgrammer {
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer:
      | null
      | ((importer: ImportDictionary) => ts.TypeAliasDeclaration);
  }

  export const generate =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (routes: IRoute[]): Map<string, IModule> => {
      const collection = new MetadataCollection({
        replace: MetadataCollection.replace,
      });
      for (const r of routes) {
        for (const p of r.parameters) {
          const res = MetadataFactory.analyze(checker)({
            escape: false,
            constant: true,
            absorb: false,
          })(collection)(p.type);
          if (res.success) p.metadata = res.data;
        }
        for (const e of Object.values(r.exceptions)) {
          const res = MetadataFactory.analyze(checker)({
            escape: true,
            constant: true,
            absorb: false,
          })(collection)(e.type);
          if (res.success) e.metadata = res.data;
        }
        const res = MetadataFactory.analyze(checker)({
          escape: true,
          constant: true,
          absorb: false,
        })(collection)(r.output.type);
        if (res.success) r.output.metadata = res.data;
      }

      const dict: Map<string, IModule> = new Map();
      for (const alias of collection.aliases())
        prepare(dict)(alias.name)((importer) =>
          define_alias(config)(importer)(alias),
        );
      for (const object of collection.objects())
        prepare(dict)(object.name)((importer) =>
          define_object(config)(importer)(object),
        );
      return dict;
    };

  const prepare =
    (dict: Map<string, IModule>) =>
    (name: string) =>
    (programmer: (importer: ImportDictionary) => ts.TypeAliasDeclaration) => {
      const accessors: string[] = name.split(".");
      const modulo: IPointer<IModule> = { value: null! };

      accessors.forEach((acc, i) => {
        modulo.value = MapUtil.take(dict, acc, () => ({
          name: acc,
          children: new Map(),
          programmer: null,
        }));
        if (i === accessors.length - 1) modulo.value.programmer = programmer;
        dict = modulo.value.children;
      });
      return modulo!;
    };

  const define_alias =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (alias: MetadataAlias): ts.TypeAliasDeclaration =>
      FormatUtil.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          alias.name.split(".").at(-1)!,
          [],
          SdkTypeProgrammer.decode(config)(importer)(alias.value),
        ),
        writeComment([])(alias.description, alias.jsDocTags),
      );

  const define_object =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (object: MetadataObject): ts.TypeAliasDeclaration => {
      const regular = object.properties.filter((p) => p.key.isSoleLiteral());
      const dynamic = object.properties.filter((p) => !p.key.isSoleLiteral());
      return FormatUtil.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          object.name.split(".").at(-1)!,
          [],
          regular.length && dynamic.length
            ? ts.factory.createIntersectionTypeNode([
                define_regular(config)(importer)(regular),
                ...dynamic.map(define_dynamic(config)(importer)),
              ])
            : dynamic.length
              ? ts.factory.createIntersectionTypeNode(
                  dynamic.map(define_dynamic(config)(importer)),
                )
              : define_regular(config)(importer)(regular),
        ),
        writeComment([])(object.description ?? null, object.jsDocTags),
      );
    };

  const define_regular =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (properties: MetadataProperty[]): ts.TypeLiteralNode =>
      ts.factory.createTypeLiteralNode(
        properties.map((p) =>
          FormatUtil.description(
            ts.factory.createPropertySignature(
              undefined,
              Escaper.variable(String(p.key.constants[0].values[0]))
                ? ts.factory.createIdentifier(
                    String(p.key.constants[0].values[0]),
                  )
                : ts.factory.createStringLiteral(
                    String(p.key.constants[0].values[0]),
                  ),
              p.value.isRequired() === false
                ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                : undefined,
              SdkTypeProgrammer.decode(config)(importer)(p.value),
            ),
            writeComment(p.value.atomics)(p.description, p.jsDocTags),
          ),
        ),
      );

  const define_dynamic =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (property: MetadataProperty): ts.TypeLiteralNode =>
      ts.factory.createTypeLiteralNode([
        FormatUtil.description(
          ts.factory.createIndexSignature(
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier("key"),
                undefined,
                SdkTypeProgrammer.decode(config)(importer)(property.key),
              ),
            ],
            SdkTypeProgrammer.decode(config)(importer)(property.value),
          ),
          writeComment(property.value.atomics)(
            property.description,
            property.jsDocTags,
          ),
        ),
      ]);
}

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
        : jsDocTags ?? [];

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
