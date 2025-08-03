import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "../structures/INestiaMigrateFile";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateE2eFunctionProgrammer } from "./NestiaMigrateE2eFileProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

/**
 * Namespace containing functions for generating end-to-end (E2E) test files.
 * 
 * This programmer generates comprehensive test files that validate the functionality
 * of the migrated API endpoints or SDK functions. The tests include proper setup,
 * execution, and validation of API calls.
 */
export namespace NestiaMigrateE2eProgrammer {
  /**
   * Generates E2E test files for all routes in the migration context.
   * 
   * Creates test files that validate each API endpoint with proper:
   * - Request parameter validation
   * - Response type checking
   * - Error handling scenarios
   * - Mock data generation
   * 
   * @param ctx - The migration context containing routes and configuration
   * @returns Record mapping test file paths to their generated content
   */
  export const write = (ctx: INestiaMigrateContext): Record<string, string> =>
    Object.fromEntries(
      ctx.application.routes
        .map((r) =>
          writeFile(ctx.config, ctx.application.document().components, r),
        )
        .map((r) => [`${r.location}/${r.file}`, r.content]),
    );

  /**
   * Generates a single E2E test file for a specific route.
   * 
   * @param config - Migration configuration
   * @param components - OpenAPI components for type resolution
   * @param route - The specific route to generate tests for
   * @returns File structure containing the generated test content
   * @internal
   */
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
