import ts from "typescript";

import { NestiaMigrateNestMethodProgrammer } from "../programmers/NestiaMigrateNestMethodProgrammer";

/**
 * Configuration interface for Nestia migration operations.
 * 
 * This interface defines the options and settings that control how the migration
 * from OpenAPI documents to NestJS applications or SDK libraries is performed.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface INestiaMigrateConfig {
  /**
   * Whether to include API simulation features in the generated code.
   * 
   * When enabled, adds mock data generation and API simulation capabilities
   * to the generated application or SDK.
   */
  simulate: boolean;

  /**
   * Whether to generate end-to-end (E2E) test files.
   * 
   * When enabled, creates comprehensive test files that validate the
   * generated API endpoints and SDK functions.
   */
  e2e: boolean;

  /**
   * Custom package name for the generated project.
   * 
   * If provided, replaces the default package name placeholders in
   * generated files with this custom package name.
   */
  package?: string;

  /**
   * Whether to enable keyword validation in the generated code.
   * 
   * Controls whether to include TypeScript keyword validation
   * features in the generated DTOs and validation logic.
   * 
   * @defaultValue true
   */
  keyword?: boolean;

  /**
   * Author information to include in generated documentation.
   * 
   * Used for adding author tags and information to generated
   * JSDoc comments and file headers.
   */
  author?: {
    /** The JSDoc tag to use (e.g., "@author") */
    tag: string;
    /** The author name or information */
    value: string;
  };

  /**
   * Custom programmers for specialized code generation.
   * 
   * Allows overriding the default code generation behavior
   * with custom functions for specific scenarios.
   */
  programmer?: {
    /**
     * Custom controller method programmer.
     * 
     * Function that generates TypeScript method declarations
     * for NestJS controller methods.
     * 
     * @param ctx - The programming context
     * @returns A TypeScript method declaration
     */
    controllerMethod?: (
      ctx: NestiaMigrateNestMethodProgrammer.IContext,
    ) => ts.MethodDeclaration;
  };
}
