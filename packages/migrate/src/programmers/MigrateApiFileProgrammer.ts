import ts from "typescript";

import { IMigrateConfig } from "../IMigrateConfig";
import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { MigrateApiFunctionProgrammer } from "./MigrateApiFunctionProgrammer";
import { MigrateApiNamespaceProgrammer } from "./MigrateApiNamespaceProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiFileProgrammer {
  export interface IProps {
    namespace: string[];
    entries: IEntry[];
    children: Set<string>;
  }
  export interface IEntry {
    controller: IMigrateController;
    route: IMigrateRoute;
    alias: string;
  }

  export const write =
    (config: IMigrateConfig) =>
    (components: ISwaggerComponents) =>
    (props: IProps): ts.Statement[] => {
      const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
      const statements: ts.Statement[] = props.entries
        .map((p) => [
          MigrateApiFunctionProgrammer.write(config)(components)(importer)(p),
          MigrateApiNamespaceProgrammer.write(config)(components)(importer)(p),
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
