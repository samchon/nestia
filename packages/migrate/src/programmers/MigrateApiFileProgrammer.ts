import { IMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { IMigrateProgram } from "../structures/IMigrateProgram";
import { MigrateApiFunctionProgrammer } from "./MigrateApiFunctionProgrammer";
import { MigrateApiNamespaceProgrammer } from "./MigrateApiNamespaceProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiFileProgrammer {
  export interface IProps {
    namespace: string[];
    routes: IMigrateRoute[];
    children: Set<string>;
  }
  export const write =
    (config: IMigrateProgram.IConfig) =>
    (components: OpenApi.IComponents) =>
    (props: IProps): ts.Statement[] => {
      const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
      const statements: ts.Statement[] = props.routes
        .map((route) => [
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
