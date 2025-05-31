import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateApiFunctionProgrammer } from "./MigrateApiFunctionProgrammer";
import { MigrateApiNamespaceProgrammer } from "./MigrateApiNamespaceProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiFileProgrammer {
  export interface IProps {
    namespace: string[];
    routes: IHttpMigrateRoute[];
    children: Set<string>;
  }
  export const write =
    (config: INestiaMigrateConfig) =>
    (components: OpenApi.IComponents) =>
    (props: IProps): ts.Statement[] => {
      const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
      const statements: ts.Statement[] = props.routes
        .map((route) => [
          FilePrinter.newLine(),
          MigrateApiFunctionProgrammer.write(config)(components)(importer)(
            route,
          ),
          MigrateApiNamespaceProgrammer.write(config)(components)(importer)(
            route,
          ),
        ])
        .flat();
      return [
        ...importer.toStatements(
          (ref) =>
            `../${"../".repeat(props.namespace.length)}structures/${ref}`,
        ),
        ...[...props.children].map((child) =>
          ts.factory.createExportDeclaration(
            undefined,
            false,
            ts.factory.createNamespaceExport(
              ts.factory.createIdentifier(child),
            ),
            ts.factory.createStringLiteral(`./${child}`),
            undefined,
          ),
        ),
        ...statements,
      ];
    };
}
