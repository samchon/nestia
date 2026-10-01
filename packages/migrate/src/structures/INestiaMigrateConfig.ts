import ts from "../internal/ts";
import { NestiaMigrateNestMethodProgrammer } from "../programmers/NestiaMigrateNestMethodProgrammer";

/**
 * Options of the migration: simulation, e2e tests, the package name, keyword
 * parameters, the author tag, and a replaceable controller method programmer.
 *
 * @evidence contracts/common.md#principled-implementation The flags choose which parts are generated and the parameter style, the package name replaces the placeholder in every file, and the programmer option lets a caller generate controller methods differently.
 * @evidence contracts/common.md#clear-and-simple-design A flat record whose optional members are the extension points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the options.
 */
export interface INestiaMigrateConfig {
  simulate: boolean;
  e2e: boolean;
  package?: string;
  keyword?: boolean;
  author?: {
    tag: string;
    value: string;
  };
  programmer?: {
    controllerMethod?: (
      ctx: NestiaMigrateNestMethodProgrammer.IContext,
    ) => ts.MethodDeclaration;
  };
}
