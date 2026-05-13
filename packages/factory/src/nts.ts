import { TypeScriptFactory } from "./TypeScriptFactory";
import * as factory from "./factory/index";
import { TypeScriptPrinter } from "./printers/TypeScriptPrinter";

export const nts = {
  factory,
  TypeScriptFactory,
  TypeScriptPrinter,
} as const;
