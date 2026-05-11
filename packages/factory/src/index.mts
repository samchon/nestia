import * as cjs from "./index.js";

const namespace: any = cjs;

export const TypeScriptFactory: any =
  namespace.TypeScriptFactory ?? namespace.default ?? namespace;
export const factory: any = namespace.factory ?? TypeScriptFactory;
export default TypeScriptFactory;
