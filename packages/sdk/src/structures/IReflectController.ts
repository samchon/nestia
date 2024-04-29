import type { VERSION_NEUTRAL } from "@nestjs/common/interfaces";

import { IReflectHttpOperation } from "./IReflectHttpOperation";
import { IReflectWebSocketOperation } from "./IReflectWebSocketOperation";

export interface IReflectController {
  constructor: Function;
  prototype: any;
  file: string;
  name: string;
  prefixes: string[];
  paths: string[];
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  operations: Array<IReflectHttpOperation | IReflectWebSocketOperation>;
  security: Record<string, string[]>[];
  swaggerTgas: string[];
}
