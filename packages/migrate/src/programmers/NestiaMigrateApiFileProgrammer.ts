import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateApiFunctionProgrammer } from "./NestiaMigrateApiFunctionProgrammer";
import { NestiaMigrateApiNamespaceProgrammer } from "./NestiaMigrateApiNamespaceProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

export namespace NestiaMigrateApiFileProgrammer {
  export interface IProps {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    namespace: string[];
    routes: IHttpMigrateRoute[];
    children: Set<string>;
  }

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
        ts.factory.createExportDeclaration(
          undefined,
          false,
          ts.factory.createNamespaceExport(ts.factory.createIdentifier(child)),
          ts.factory.createStringLiteral(`./${child}`),
          undefined,
        ),
      ),
      ...statements,
    ];
  };
}
