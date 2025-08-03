import { IHttpMigrateApplication, OpenApi } from "@samchon/openapi";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

/**
 * Interface representing a complete migration program result.
 * 
 * This interface defines the complete output of a migration operation,
 * including the generated files, configuration used, and any errors encountered.
 */
export interface INestiaMigrateProgram {
  /**
   * The generation mode used for this migration.
   * 
   * - "nest": Generated NestJS application files
   * - "sdk": Generated SDK library files
   */
  mode: "nest" | "sdk";

  /**
   * The original OpenAPI document that was migrated.
   * 
   * The source OpenAPI specification that served as input
   * for the migration process.
   */
  document: OpenApi.IDocument;

  /**
   * The configuration used for this migration.
   * 
   * Contains all the settings and options that were applied
   * during the migration process.
   */
  config: INestiaMigrateConfig;

  /**
   * Record of generated files from the migration.
   * 
   * Maps file paths to file contents for all generated files.
   * The keys are relative file paths and values are the complete
   * file contents as strings.
   */
  files: Record<string, string>;

  /**
   * Array of errors that occurred during migration.
   * 
   * Contains any errors or warnings encountered while processing
   * the OpenAPI document and generating the target files.
   */
  errors: IHttpMigrateApplication.IError[];
}
