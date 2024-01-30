import { IPointer } from "tstl";
import ts from "typescript";

import { ISwaggerSchema } from "../structures/ISwaggeSchema";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { FilePrinter } from "../utils/FilePrinter";
import { MapUtil } from "../utils/MapUtil";
import { ImportProgrammer } from "./ImportProgrammer";
import { SchemaProgrammer } from "./SchemaProgrammer";

export namespace DtoProgrammer {
  export interface IModule {
    name: string;
    children: Map<string, IModule>;
    programmer:
      | null
      | ((importer: ImportProgrammer) => ts.TypeAliasDeclaration);
  }

  export const write = (
    components: ISwaggerComponents,
  ): Map<string, IModule> => {
    const dict: Map<string, IModule> = new Map();
    for (const [key, value] of Object.entries(components.schemas ?? {}))
      prepare(dict)(key)((importer) =>
        writeAlias(importer)(components)(key, value),
      );
    return dict;
  };

  const prepare =
    (dict: Map<string, IModule>) =>
    (name: string) =>
    (programmer: (importer: ImportProgrammer) => ts.TypeAliasDeclaration) => {
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
    (importer: ImportProgrammer) =>
    (components: ISwaggerComponents) =>
    (key: string, value: ISwaggerSchema) =>
      FilePrinter.description(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
          key.split(".").at(-1)!,
          [],
          SchemaProgrammer.write(importer)(components)(value),
        ),
        writeComment(value),
      );
}

const writeComment = (schema: ISwaggerSchema): string =>
  [
    ...(schema.description?.length ? [schema.description] : []),
    ...(schema.description?.length &&
    (schema.title !== undefined || schema.deprecated === true)
      ? [""]
      : []),
    ...(schema.title !== undefined ? [`@title ${schema.title}`] : []),
    ...(schema.deprecated === true ? [`@deprecated`] : []),
  ].join("\n");
