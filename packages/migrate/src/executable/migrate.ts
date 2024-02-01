#!/usr/bin/env node
import { MigrateCommander } from "../internal/MigrateCommander";

MigrateCommander.main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
