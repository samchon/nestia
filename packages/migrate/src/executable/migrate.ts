#!/usr/bin/env node
import { NestiaMigrateCommander } from "./NestiaMigrateCommander";

NestiaMigrateCommander.main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
