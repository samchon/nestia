import {
  HttpMigration,
  IHttpMigrateApplication,
  OpenApi,
  OpenApiV3,
  OpenApiV3_1,
  SwaggerV2,
} from "@samchon/openapi";
import typia, { IValidation } from "typia";

import { NEST_TEMPLATE } from "./bundles/NEST_TEMPLATE";
import { SDK_TEMPLATE } from "./bundles/SDK_TEMPLATE";
import { NestiaMigrateApiProgrammer } from "./programmers/NestiaMigrateApiProgrammer";
import { NestiaMigrateApiStartProgrammer } from "./programmers/NestiaMigrateApiStartProgrammer";
import { NestiaMigrateE2eProgrammer } from "./programmers/NestiaMigrateE2eProgrammer";
import { NestiaMigrateNestProgrammer } from "./programmers/NestiaMigrateNestProgrammer";
import { INestiaMigrateConfig } from "./structures/INestiaMigrateConfig";
import { INestiaMigrateContext } from "./structures/INestiaMigrateContext";
import { INestiaMigrateFile } from "./structures/INestiaMigrateFile";

/**
 * Main application class for migrating Swagger/OpenAPI documents to NestJS applications or SDK libraries.
 * 
 * The NestiaMigrateApplication class provides functionality to parse OpenAPI specifications
 * and generate corresponding NestJS controllers, DTOs, API clients, and test files.
 * It supports both NestJS backend generation and SDK library generation modes.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export class NestiaMigrateApplication {
  private readonly data_: IHttpMigrateApplication;

  /* -----------------------------------------------------------
    CONSTRUCTORS
  ----------------------------------------------------------- */
  
  /**
   * Creates a new NestiaMigrateApplication instance from an OpenAPI document.
   * 
   * @param document - The OpenAPI document to migrate from
   */
  public constructor(public readonly document: OpenApi.IDocument) {
    this.data_ = HttpMigration.application(document);
  }

  /**
   * Creates a new NestiaMigrateApplication instance with assertion validation.
   * 
   * Validates the input document using typia assertion and converts it to the
   * standardized OpenAPI format before creating the application instance.
   * 
   * @param document - The OpenAPI/Swagger document to migrate from
   * @returns A new NestiaMigrateApplication instance
   * @throws Will throw an error if the document validation fails
   */
  public static assert(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument,
  ): NestiaMigrateApplication {
    return new NestiaMigrateApplication(
      OpenApi.convert(typia.assert(document)),
    );
  }

  /**
   * Creates a new NestiaMigrateApplication instance with validation.
   * 
   * Validates the input document using typia validation and converts it to the
   * standardized OpenAPI format before creating the application instance.
   * Returns a validation result that indicates success or failure.
   * 
   * @param document - The OpenAPI/Swagger document to migrate from
   * @returns Validation result containing either the application instance or error details
   */
  public static validate(
    document:
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument,
  ): IValidation<NestiaMigrateApplication> {
    const result: IValidation<
      | SwaggerV2.IDocument
      | OpenApiV3.IDocument
      | OpenApiV3_1.IDocument
      | OpenApi.IDocument
    > = typia.validate(document);
    if (result.success === false) return result;
    return {
      success: true,
      data: new NestiaMigrateApplication(OpenApi.convert(document)),
    };
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  
  /**
   * Gets the internal HTTP migration application data.
   * 
   * @returns The parsed HTTP migration application structure
   */
  public getData(): IHttpMigrateApplication {
    return this.data_;
  }

  /**
   * Gets migration errors that occurred during document parsing.
   * 
   * @deprecated Use getData().errors instead
   * @returns Array of migration errors
   */
  public getErrors(): IHttpMigrateApplication.IError[] {
    return this.data_.errors;
  }

  /**
   * Generates NestJS application files from the OpenAPI document.
   * 
   * Creates a complete NestJS application including controllers, DTOs, services,
   * and optionally test files based on the provided configuration.
   * 
   * @param config - Configuration options for the NestJS generation
   * @returns Record of file paths to file contents for the generated NestJS application
   */
  public nest(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "nest",
      this.data_,
      config,
    );
    const files: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(NEST_TEMPLATE).filter(
          ([key]) =>
            key.startsWith("src/api/structures") === false &&
            key.startsWith("src/api/functional") === false &&
            key.startsWith("src/api/controllers") === false &&
            key.startsWith("test/features") === false,
        ),
      ),
      ...NestiaMigrateNestProgrammer.write(context),
      ...NestiaMigrateApiProgrammer.write(context),
      ...(config.e2e ? NestiaMigrateE2eProgrammer.write(context) : {}),
      ...(config.keyword === false
        ? {
            "nestia.config.ts": NEST_TEMPLATE["nestia.config.ts"].replace(
              "keyword: true",
              "keyword: false",
            ),
          }
        : {}),
    };
    return config.package ? renameSlug(config.package, files) : files;
  }

  /**
   * Generates SDK library files from the OpenAPI document.
   * 
   * Creates a TypeScript SDK library with API client functions, type definitions,
   * and optionally test files based on the provided configuration.
   * 
   * @param config - Configuration options for the SDK generation
   * @returns Record of file paths to file contents for the generated SDK library
   */
  public sdk(config: INestiaMigrateConfig): Record<string, string> {
    const context: INestiaMigrateContext = createContext(
      "sdk",
      this.data_,
      config,
    );
    const files: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(SDK_TEMPLATE).filter(
          ([key]) =>
            key.startsWith("src/structures") === false &&
            key.startsWith("src/functional") === false &&
            key.startsWith("test/features") === false,
        ),
      ),
      ...NestiaMigrateApiProgrammer.write(context),
      ...NestiaMigrateApiStartProgrammer.write(context),
      ...(config.e2e ? NestiaMigrateE2eProgrammer.write(context) : {}),
      "swagger.json": JSON.stringify(this.document, null, 2),
    };
    return config.package ? renameSlug(config.package, files) : files;
  }
}

/**
 * Namespace containing types and interfaces related to the NestiaMigrateApplication.
 * 
 * @deprecated This namespace may be removed in future versions
 */
export namespace MigrateApplication {
  /**
   * Output structure for migration operations.
   * 
   * @deprecated Use the return types of nest() and sdk() methods directly
   */
  export interface IOutput {
    /** Migration context used for the operation */
    context: INestiaMigrateContext;
    /** Generated files from the migration */
    files: INestiaMigrateFile[];
    /** Errors that occurred during migration */
    errors: IHttpMigrateApplication.IError[];
  }
}

/**
 * Creates a migration context for internal use.
 * 
 * @param mode - The generation mode (nest or sdk)
 * @param application - The HTTP migration application data
 * @param config - The migration configuration
 * @returns A new migration context
 * @internal
 */

const createContext = (
  mode: "nest" | "sdk",
  application: IHttpMigrateApplication,
  config: INestiaMigrateConfig,
): INestiaMigrateContext => {
  return {
    mode,
    application,
    config,
  };
};

/**
 * Renames package placeholders in generated files with the specified package name.
 * 
 * @param slug - The package name to use as replacement
 * @param files - Record of file paths to file contents
 * @returns Updated files with package placeholders replaced
 * @internal
 */
const renameSlug = (
  slug: string,
  files: Record<string, string>,
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(files).map(([key, value]) => [
      key,
      value.split(`@ORGANIZATION/PROJECT`).join(slug),
    ]),
  );
};
