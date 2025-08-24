#!/usr/bin/env node

/**
 * @fileoverview Command-line entry point for the @nestia/migrate package.
 * 
 * This script serves as the main executable for the Nestia migration tool.
 * It handles command-line arguments and orchestrates the migration process
 * from OpenAPI/Swagger documents to NestJS applications or SDK libraries.
 */

import { NestiaMigrateCommander } from "./NestiaMigrateCommander";

NestiaMigrateCommander.main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
