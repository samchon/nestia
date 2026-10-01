import { type Node, SyntaxKind, type TypeNode, factory } from "@ttsc/factory";
import { IPointer } from "tstl";
import { IJsDocTagInfo } from "typia";

import {
  MetadataAliasType,
  MetadataAtomic,
  MetadataObjectType,
} from "../../internal/legacy";
import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedApplication } from "../../structures/ITypedApplication";
import { MapUtil } from "../../utils/MapUtil";
import { StringUtil } from "../../utils/StringUtil";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

/**
 * Composes the DTO declarations of the HTTP routes.
 *
 * @evidence contracts/common.md#principled-implementation The namespace turns each named object and alias of the collection into a declaration, placed in a tree of modules by its dotted name.
 * @evidence contracts/common.md#clear-and-simple-design One public function and three helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unnamed type is never declared.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 */
export namespace SdkHttpCloneProgrammer {
  /**
   * A module of the declaration tree: its name, its children, and the writer of
   * its own declaration.
   *
   * @evidence contracts/common.md#principled-implementation A module without a writer only holds children.
   * @evidence contracts/common.md#clear-and-simple-design A three-member record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer: null | ((importer: ImportDictionary) => Node);
  }

  /**
   * Returns the declaration tree of the application's named types, keyed by
   * their top-level name.
   *
   * @evidence contracts/common.md#principled-implementation Objects and aliases with a name of their own are registered, and an implicit name is skipped.
   * @evidence contracts/common.md#clear-and-simple-design Two loops.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The implicit test is the shared definition.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const write = (app: ITypedApplication): Map<string, IModule> => {
    // COMPOSE THE DICTIONARY
    const dict: Map<string, IModule> = new Map();
    for (const [k, v] of app.collection.objects.entries())
      if (StringUtil.isImplicit(k) === false)
        prepare({
          dict,
          name: k,
          programmer: (importer) => writeObject(app.project)(importer)(v),
        });
    for (const [k, v] of app.collection.aliases.entries())
      if (StringUtil.isImplicit(k) === false)
        prepare({
          dict,
          name: k,
          programmer: (importer) => writeAlias(app.project)(importer)(v),
        });
    return dict;
  };

  const prepare = (props: {
    dict: Map<string, IModule>;
    name: string;
    programmer: (importer: ImportDictionary) => Node;
  }) => {
    let next: Map<string, IModule> = props.dict;
    const accessors: string[] = StringUtil.accessorsOf(props.name);
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

  const writeAlias =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (alias: MetadataAliasType): Node =>
      FilePrinter.description(
        factory.createTypeAliasDeclaration(
          [factory.createToken(SyntaxKind.ExportKeyword)],
          StringUtil.accessorsOf(alias.name).at(-1)!,
          [],
          SdkTypeProgrammer.write(project)(importer)(alias.value) as TypeNode,
        ),
        writeComment([])(alias.description, alias.jsDocTags),
      );

  const writeObject =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (object: MetadataObjectType): Node => {
      return FilePrinter.description(
        factory.createTypeAliasDeclaration(
          [factory.createToken(SyntaxKind.ExportKeyword)],
          StringUtil.accessorsOf(object.name).at(-1)!,
          [],
          SdkTypeProgrammer.write_object(project)(importer)(object) as TypeNode,
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
