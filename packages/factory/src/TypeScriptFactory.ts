import * as implementation from "./factory/index";

export type TypeScriptFactory = typeof implementation;
export const TypeScriptFactory: any = implementation;
