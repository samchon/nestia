import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "../structures/INestiaMigrateFile";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateE2eFunctionProgrammer } from "./NestiaMigrateE2eFileProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

export namespace NestiaMigrateE2eProgrammer {
  export const write = (ctx: INestiaMigrateContext): Record<string, string> =>
    Object.fromEntries(
      ctx.application.routes
        .map((r) =>
          writeFile(ctx.config, ctx.application.document().components, r),
        )
        .map((r) => [`${r.location}/${r.file}`, r.content]),
    );

  const writeFile = (
    config: INestiaMigrateConfig,
    components: OpenApi.IComponents,
    route: IHttpMigrateRoute,
  ): INestiaMigrateFile => {
    const importer: NestiaMigrateImportProgrammer =
      new NestiaMigrateImportProgrammer();
    const func: ts.FunctionDeclaration =
      NestiaMigrateE2eFunctionProgrammer.write({
        config,
        components,
        importer,
        route,
      });
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
