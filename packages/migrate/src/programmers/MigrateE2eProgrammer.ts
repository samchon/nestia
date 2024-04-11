import { OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { IMigrateFile } from "../structures/IMigrateFile";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateE2eFunctionProgrammer } from "./MigrateE2eFileProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateE2eProgrammer {
  export const write = (program: IMigrateProgram): IMigrateFile[] =>
    program.controllers
      .map((c) => c.routes.map(writeFile(program.document.components)))
      .flat();

  const writeFile =
    (components: OpenApi.IComponents) =>
    (route: IMigrateRoute): IMigrateFile => {
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
