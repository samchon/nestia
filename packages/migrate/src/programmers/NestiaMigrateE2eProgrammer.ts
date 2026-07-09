import { IHttpMigrateRoute, OpenApi } from "@typia/interface";

import ts from "../internal/ts";
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
          writeFile(
            ctx.mode,
            ctx.config,
            ctx.application.document().components,
            r,
          ),
        )
        .map((r) => [`${r.location}/${r.file}`, r.content]),
    );

  const writeFile = (
    mode: INestiaMigrateContext["mode"],
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
      // The monorepo template consumes the api workspace package through its
      // package name, while the single-package sdk template keeps resolving
      // the built `lib` paths through tsconfig path mappings.
      ...importer.toStatements((name) =>
        mode === "nest"
          ? "@ORGANIZATION/PROJECT-api"
          : `@ORGANIZATION/PROJECT-api/lib/structures/${name}`,
      ),
      FilePrinter.newLine(),
      func,
    ];
    return {
      location:
        mode === "nest"
          ? `packages/backend/test/features/api`
          : `test/features/api`,
      file: `${["test", "api", ...route.accessor].join("_")}.ts`,
      content: FilePrinter.write({ statements }),
    };
  };
}
