import ts from "typescript";

import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { ApiFunctionProgrammer } from "./ApiFunctionProgrammer";
import { ApiNamespaceProgrammer } from "./ApiNamespaceProgrammer";
import { ImportProgrammer } from "./ImportProgrammer";

export namespace ApiFileProgrammer {
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
    (components: ISwaggerComponents) =>
    (props: IProps): ts.Statement[] => {
      const importer: ImportProgrammer = new ImportProgrammer();
      const statements: ts.Statement[] = props.entries
        .map((p) => [
          ApiFunctionProgrammer.write(components)(importer)(p),
          ApiNamespaceProgrammer.write(components)(importer)(p),
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
