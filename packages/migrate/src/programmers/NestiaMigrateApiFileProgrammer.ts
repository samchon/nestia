import { type Statement, factory } from "@ttsc/factory";
import { IHttpMigrateRoute, OpenApi } from "@typia/interface";

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

  export const write = (props: IProps): Statement[] => {
    const importer: NestiaMigrateImportProgrammer =
      new NestiaMigrateImportProgrammer();
    const statements: Statement[] = props.routes
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
