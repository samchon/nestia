import { factory } from "@ttsc/factory";
import { IHttpMigrateRoute, OpenApi } from "@typia/interface";

import ts from "../internal/ts";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateApiFunctionProgrammer } from "./NestiaMigrateApiFunctionProgrammer";
import { NestiaMigrateApiNamespaceProgrammer } from "./NestiaMigrateApiNamespaceProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

/**
 * Generates one file of the functional API: the imports, the exports of the
 * child namespaces, and the functions of the routes at this level.
 *
 * @evidence contracts/common.md#principled-implementation Each route contributes its function and its namespace, the imports are collected by one importer and emitted first, and each child namespace is re-exported, so a file is a complete module.
 * @evidence contracts/common.md#clear-and-simple-design One function over the two per-route programmers and the importer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The output derives from the routes and the configuration.
 * @evidence contracts/common.md#meaningful-documentation The comment states the file's content.
 */
export namespace NestiaMigrateApiFileProgrammer {
  /**
   * The input of one API file: the configuration, the components, the namespace
   * path, the routes, and the child namespaces.
   *
   * @evidence contracts/common.md#principled-implementation The record holds exactly what a file needs, so files can be generated independently.
   * @evidence contracts/common.md#clear-and-simple-design A flat record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the fields.
   */
  export interface IProps {
    /** Calling convention and optional generated features for this operation. */
    config: INestiaMigrateConfig;

    /** Component schemas used to resolve DTO references. */
    components: OpenApi.IComponents;

    /** Accessor prefix locating this functional API index. */
    namespace: string[];

    /** Operations whose functions belong directly to this index. */
    routes: IHttpMigrateRoute[];

    /** Immediate child namespace names re-exported by this index. */
    children: Set<string>;
  }

  /**
   * Returns the statements of one API file.
   *
   * @evidence contracts/common.md#principled-implementation The relative path to the structures directory is derived from the namespace depth, so imports resolve from every level.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The depth is computed, not hardcoded.
   * @evidence contracts/common.md#meaningful-documentation The comment states its result.
   */
  export const write = (props: IProps): ts.Statement[] => {
    const importer: NestiaMigrateImportProgrammer =
      new NestiaMigrateImportProgrammer();
    const statements: ts.Statement[] = props.routes
      .map((route) => [
        FilePrinter.newLine(),
        NestiaMigrateApiFunctionProgrammer.write({
          config: props.config,
          components: props.components,
          importer,
          route,
        }),
        NestiaMigrateApiNamespaceProgrammer.write({
          config: props.config,
          components: props.components,
          importer,
          route,
        }),
      ])
      .flat();
    return [
      ...importer.toStatements(
        (ref) => `../${"../".repeat(props.namespace.length)}structures/${ref}`,
      ),
      ...[...props.children].map((child) =>
        factory.createExportDeclaration(
          undefined,
          false,
          factory.createNamespaceExport(factory.createIdentifier(child)),
          factory.createStringLiteral(`./${child}/index`),
        ),
      ),
      ...statements,
    ];
  };
}
