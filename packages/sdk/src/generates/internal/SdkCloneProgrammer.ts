import { IPointer } from "tstl";
import ts from "typescript";
import { IJsDocTagInfo } from "typia";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { MetadataAlias } from "typia/lib/schemas/metadata/MetadataAlias";
import { MetadataAtomic } from "typia/lib/schemas/metadata/MetadataAtomic";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";

import { INestiaConfig } from "../../INestiaConfig";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { MapUtil } from "../../utils/MapUtil";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkCloneProgrammer {
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer:
      | null
      | ((importer: ImportDictionary) => ts.TypeAliasDeclaration);
  }

  export const write =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (routes: ITypedHttpRoute[]): Map<string, IModule> => {
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
        if (isNamedDeclaration(alias.name))
          prepare(dict)(alias.name)((importer) =>
            write_alias(config)(importer)(alias),
          );
      for (const object of collection.objects())
        if (isNamedDeclaration(object.name))
          prepare(dict)(object.name)((importer) =>
            write_object(config)(importer)(object),
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

  const write_alias =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (alias: MetadataAlias): ts.TypeAliasDeclaration =>
      FilePrinter.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          alias.name.split(".").at(-1)!,
          [],
          SdkTypeProgrammer.write(config)(importer)(alias.value),
        ),
        writeComment([])(alias.description, alias.jsDocTags),
      );

  const write_object =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (object: MetadataObject): ts.TypeAliasDeclaration => {
      return FilePrinter.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          object.name.split(".").at(-1)!,
          [],
          SdkTypeProgrammer.write_object(config)(importer)(object),
        ),
        writeComment([])(object.description ?? null, object.jsDocTags),
      );
    };
}

const isNamedDeclaration = (name: string) =>
  name !== "object" &&
  name !== "__type" &&
  !name.startsWith("__type.") &&
  name !== "__object" &&
  !name.startsWith("__object.");

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
