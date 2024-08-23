import { IPointer } from "tstl";
import ts from "typescript";
import { IJsDocTagInfo } from "typia";
import { MetadataAlias } from "typia/lib/schemas/metadata/MetadataAlias";
import { MetadataAtomic } from "typia/lib/schemas/metadata/MetadataAtomic";
import { MetadataObject } from "typia/lib/schemas/metadata/MetadataObject";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedApplication } from "../../structures/ITypedApplication";
import { MapUtil } from "../../utils/MapUtil";
import { StringUtil } from "../../utils/StringUtil";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkHttpCloneProgrammer {
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer:
      | null
      | ((importer: ImportDictionary) => ts.TypeAliasDeclaration);
  }

  export const write = (app: ITypedApplication): Map<string, IModule> => {
    // COMPOSE THE DICTIONARY
    const dict: Map<string, IModule> = new Map();
    for (const [k, v] of app.collection.objects.entries())
      if (StringUtil.isImplicit(k) === false)
        prepare({
          dict,
          name: k,
          programmer: (importer) => write_object(app.project)(importer)(v),
        });
    for (const [k, v] of app.collection.aliases.entries())
      if (StringUtil.isImplicit(k) === false)
        prepare({
          dict,
          name: k,
          programmer: (importer) => write_alias(app.project)(importer)(v),
        });
    return dict;
  };

  const prepare = (props: {
    dict: Map<string, IModule>;
    name: string;
    programmer: (importer: ImportDictionary) => ts.TypeAliasDeclaration;
  }) => {
    let next: Map<string, IModule> = props.dict;
    const accessors: string[] = props.name.split(".");
    const modulo: IPointer<IModule> = { value: null! };

    accessors.forEach((acc, i) => {
      modulo.value = MapUtil.take(next, acc, () => ({
        name: acc,
        children: new Map(),
        programmer: null,
      }));
      if (i === accessors.length - 1)
        modulo.value.programmer = props.programmer;
      next = modulo.value.children;
    });
    return modulo!;
  };

  const write_alias =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (alias: MetadataAlias): ts.TypeAliasDeclaration =>
      FilePrinter.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          alias.name.split(".").at(-1)!,
          [],
          SdkTypeProgrammer.write(project)(importer)(alias.value),
        ),
        writeComment([])(alias.description, alias.jsDocTags),
      );

  const write_object =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (object: MetadataObject): ts.TypeAliasDeclaration => {
      return FilePrinter.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          object.name.split(".").at(-1)!,
          [],
          SdkTypeProgrammer.write_object(project)(importer)(object),
        ),
        writeComment([])(object.description ?? null, object.jsDocTags),
      );
    };
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
