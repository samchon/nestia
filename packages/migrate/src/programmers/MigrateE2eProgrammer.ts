import { OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { IHttpMigrateFile } from "../structures/IHttpMigrateFile";
import { IHttpMigrateProgram } from "../structures/IHttpMigrateProgram";
import { IHttpMigrateRoute } from "../structures/IHttpMigrateRoute";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateE2eFunctionProgrammer } from "./MigrateE2eFileProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateE2eProgrammer {
  export const write = (program: IHttpMigrateProgram): IHttpMigrateFile[] =>
    program.routes.map(writeFile(program.document.components));

  const writeFile =
    (components: OpenApi.IComponents) =>
    (route: IHttpMigrateRoute): IHttpMigrateFile => {
      const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
      const func: ts.FunctionDeclaration =
        MigrateE2eFunctionProgrammer.write(components)(importer)(route);
      const statements: ts.Statement[] = [
        ...importer.toStatements(
          (name) => `@ORGANIZATION/PROJECT-api/lib/structures/${name}`,
        ),
        FilePrinter.newLine(),
        func,
      ];
      return {
        location: `test/features/api`,
        file: `${["test", "api", ...route.accessor].join("_")}.ts`,
        content: FilePrinter.write({ statements }),
      };
    };
}
