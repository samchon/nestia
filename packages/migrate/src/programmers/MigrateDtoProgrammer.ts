import { OpenApi } from "@samchon/openapi";
import { IPointer } from "tstl";
import ts from "typescript";

import { FilePrinter } from "../utils/FilePrinter";
import { MapUtil } from "../utils/MapUtil";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateDtoProgrammer {
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer:
      | null
      | ((importer: MigrateImportProgrammer) => ts.TypeAliasDeclaration);
  }

  export const compose = (
    components: OpenApi.IComponents,
  ): Map<string, IModule> => {
    const dict: Map<string, IModule> = new Map();
    for (const [key, value] of Object.entries(components.schemas ?? {}))
      prepare(dict)(key)((importer) =>
        writeAlias(components)(importer)(key, value),
      );
    return dict;
  };

  const prepare =
    (dict: Map<string, IModule>) =>
    (name: string) =>
    (
      programmer: (
        importer: MigrateImportProgrammer,
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
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (key: string, value: OpenApi.IJsonSchema) =>
      FilePrinter.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          key.split(".").at(-1)!,
          [],
          MigrateSchemaProgrammer.write(components)(importer)(value),
        ),
        writeComment(value),
      );
}

const writeComment = (schema: OpenApi.IJsonSchema): string =>
  [
    ...(schema.description?.length ? [schema.description] : []),
    ...(schema.description?.length &&
    (schema.title !== undefined || schema.deprecated === true)
      ? [""]
      : []),
    ...(schema.title !== undefined ? [`@title ${schema.title}`] : []),
    ...(schema.deprecated === true ? [`@deprecated`] : []),
  ].join("\n");
