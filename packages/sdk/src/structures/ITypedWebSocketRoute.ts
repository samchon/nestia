import { VERSION_NEUTRAL } from "@nestjs/common";
import ts from "typescript";

import { IReflectController } from "./IReflectController";
import { IReflectTypeImport } from "./IReflectTypeImport";
import { ITypedWebSocketRouteParameter } from "./ITypedWebSocketRouteParameter";

export interface ITypedWebSocketRoute {
  protocol: "websocket";
  controller: IReflectController;
  name: string;
  path: string;
  accessors: string[];
  function: Function;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: ITypedWebSocketRouteParameter[];
  imports: IReflectTypeImport[];
  description: string | null;
  jsDocTags: ts.JSDocTagInfo[];
}
