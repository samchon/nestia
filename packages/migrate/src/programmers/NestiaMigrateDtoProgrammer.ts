import { SyntaxKind, factory } from "@ttsc/factory";
import { OpenApi } from "@typia/interface";
import { IPointer } from "tstl";

import ts from "../internal/ts";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { FilePrinter } from "../utils/FilePrinter";
import { MapUtil } from "../utils/MapUtil";
import { StringUtil } from "../utils/StringUtil";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateSchemaProgrammer } from "./NestiaMigrateSchemaProgrammer";

/**
 * Generates the DTO type aliases from the component schemas.
 *
 * @evidence contracts/common.md#principled-implementation Each component name is normalized into a valid dotted name, the dots become nested namespaces, and each schema becomes an exported type alias with its description and its tags as a comment.
 * @evidence contracts/common.md#clear-and-simple-design One public function and private builders for the module tree and the alias.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The names derive from the schema names.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateDtoProgrammer {
  /**
   * A node of the DTO namespace tree: its name, its children, and the writer of
   * its alias, or `null` for a namespace without a type of its own.
   *
   * @evidence contracts/common.md#principled-implementation The tree mirrors the dotted names of the schemas, so a namespace exists exactly when a name passes through it.
   * @evidence contracts/common.md#clear-and-simple-design A three-member record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states the meaning of each member.
   */
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer:
      | null
      | ((importer: NestiaMigrateImportProgrammer) => ts.TypeAliasDeclaration);
  }

  /**
   * Returns the root of the DTO tree: a map from the first name segment to its
   * module.
   *
   * @evidence contracts/common.md#principled-implementation Each schema key is split on slashes, its segments are escaped into valid identifiers and joined, and the result is inserted along its dotted path.
   * @evidence contracts/common.md#clear-and-simple-design One function over one insertion helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The names come from the document.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const compose = (props: {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
  }): Map<string, IModule> => {
    const dict: Map<string, IModule> = new Map();
    for (const [key, value] of Object.entries(props.components.schemas ?? {})) {
      const emendedKey: string = key
        .split("/")
        .filter((str) => str.length !== 0)
        .map(StringUtil.escapeNonVariable)
        .join("");
      prepare(dict)(emendedKey)((importer) =>
        writeAlias(props.config)(props.components)(importer)(emendedKey, value),
      );
    }
    return dict;
  };

  const prepare =
    (dict: Map<string, IModule>) =>
    (name: string) =>
    (
      programmer: (
        importer: NestiaMigrateImportProgrammer,
      ) => ts.TypeAliasDeclaration,
    ) => {
      const accessors: string[] = name.split(".");
      const modulo: IPointer<IModule> = { value: null! };

      accessors.forEach((acc, i) => {
        modulo.value = MapUtil.take(dict)(acc)(() => ({
          name: acc,
          children: new Map(),
          programmer: null,
        }));
        if (i === accessors.length - 1) modulo.value.programmer = programmer;
        dict = modulo.value.children;
      });
      return modulo!;
    };

  const writeAlias =
    (config: INestiaMigrateConfig) =>
    (components: OpenApi.IComponents) =>
    (importer: NestiaMigrateImportProgrammer) =>
    (key: string, value: OpenApi.IJsonSchema) =>
      FilePrinter.description(
        factory.createTypeAliasDeclaration(
          [factory.createToken(SyntaxKind.ExportKeyword)],
          key.split(".").at(-1)!,
          [],
          NestiaMigrateSchemaProgrammer.write({
            components,
            importer,
            schema: value,
          }),
        ),
        writeComment(config)(value, key.indexOf(".") === -1),
      );
}

const writeComment =
  (config: INestiaMigrateConfig) =>
  (schema: OpenApi.IJsonSchema, top: boolean): string => {
    // PLUGIN PROPERTIES (x-) AS JSDOC TAGS
    //
    // Mirror NestiaMigrateSchemaProgrammer: emit every `x-` extension property
    // whose value is a primitive as an `@x-key value` JSDoc tag, so the plugin
    // metadata survives the swagger -> DTO round trip.
    const plugins: string[] = [];
    for (const [key, value] of Object.entries(schema))
      if (key.startsWith("x-") && isExtensionValue(value))
        plugins.push(`@${key} ${String(value)}`);
    return [
      ...(schema.description?.length ? [schema.description] : []),
      ...(schema.description?.length &&
      (schema.title !== undefined ||
        schema.deprecated === true ||
        plugins.length !== 0)
        ? [""]
        : []),
      ...(schema.title !== undefined ? [`@title ${schema.title}`] : []),
      ...(schema.deprecated === true ? [`@deprecated`] : []),
      ...plugins,
      ...(top
        ? [
            `@${config.author?.tag ?? "nestia"} ${config.author?.value ?? "Generated by Nestia - https://github.com/samchon/nestia"}`,
          ]
        : []),
    ].join("\n");
  };

const isExtensionValue = (value: unknown): value is boolean | number | string =>
  typeof value === "boolean" ||
  typeof value === "number" ||
  typeof value === "string";
