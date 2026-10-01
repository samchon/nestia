import { IHttpMigrateRoute, OpenApi } from "@typia/interface";

import ts from "../internal/ts";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "../structures/INestiaMigrateFile";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateE2eFunctionProgrammer } from "./NestiaMigrateE2eFileProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

/**
 * Generates the e2e test files, one per route.
 *
 * @evidence contracts/common.md#principled-implementation Each route becomes a file whose path depends on the mode and whose imports are resolved through the package name for a monorepo and through the built library path otherwise.
 * @evidence contracts/common.md#clear-and-simple-design One public function and one private file writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The layout follows the accessors.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateE2eProgrammer {
  /**
   * Returns the map from file path to content of the e2e tests.
   *
   * @evidence contracts/common.md#principled-implementation The file name is `test_api_` plus the accessor, so each route has exactly one file.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The names follow the accessors.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
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
