import { IHttpMigrateApplication } from "@samchon/openapi";

import { INestiaMigrateConfig } from "./INestiaMigrateConfig";

/**
 * Context interface for Nestia migration operations.
 * 
 * This interface provides the complete context needed for code generation
 * during the migration process, including the generation mode, parsed
 * application data, and user configuration.
 */
export interface INestiaMigrateContext {
  /**
   * The generation mode for the migration operation.
   * 
   * - "nest": Generate NestJS application files (controllers, DTOs, services)
   * - "sdk": Generate SDK library files (API client functions, types)
   */
  mode: "nest" | "sdk";

  /**
   * The parsed HTTP migration application data.
   * 
   * Contains the structured representation of the OpenAPI document
   * including routes, schemas, and other metadata needed for code generation.
   */
  application: IHttpMigrateApplication;

  /**
   * User-provided configuration for the migration operation.
   * 
   * Contains settings that control various aspects of the code generation
   * process, such as simulation features, testing, and custom programmers.
   */
  config: INestiaMigrateConfig;
}
