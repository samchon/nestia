import type { VERSION_NEUTRAL } from "@nestjs/common/interfaces";

import { IReflectHttpOperation } from "./IReflectHttpOperation";
import { IReflectWebSocketOperation } from "./IReflectWebSocketOperation";

export interface IReflectController {
  class: Function;
  prefixes: string[];
  paths: string[];
  file: string;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  operations: Array<IReflectHttpOperation | IReflectWebSocketOperation>;
  security: Record<string, string[]>[];
  tags: string[];
}
