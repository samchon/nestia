import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "../structures/INestiaMigrateFile";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateE2eFunctionProgrammer } from "./MigrateE2eFileProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateE2eProgrammer {
  export const write = (
    program: INestiaMigrateContext,
  ): Record<string, string> =>
    Object.fromEntries(
      program.routes
        .map(writeFile(program.document.components))
        .map((r) => [`${r.location}/${r.file}`, r.content]),
    );

  const writeFile =
    (components: OpenApi.IComponents) =>
    (route: IHttpMigrateRoute): INestiaMigrateFile => {
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
