/**
 * @fileoverview Main entry point for the @nestia/migrate package.
 * 
 * This package provides functionality to migrate from Swagger/OpenAPI documents
 * to NestJS applications or SDK libraries. It analyzes OpenAPI specifications
 * and generates corresponding NestJS controllers, DTOs, and API clients.
 */

import * as migrate from "./module";

export default migrate;
export * from "./module";
