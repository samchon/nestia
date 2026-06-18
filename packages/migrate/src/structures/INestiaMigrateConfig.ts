import { type MethodDeclaration } from "@ttsc/factory";

import { NestiaMigrateNestMethodProgrammer } from "../programmers/NestiaMigrateNestMethodProgrammer";

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
    ) => MethodDeclaration;
  };
}
