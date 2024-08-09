import { VERSION_NEUTRAL } from "@nestjs/common";
import ts from "typescript";

import { IReflectTypeImport } from "./IReflectTypeImport";
import { IReflectWebSocketOperationParameter } from "./IReflectWebSocketOperationParameter";

export interface IReflectWebSocketOperation {
  protocol: "websocket";
  name: string;
  paths: string[];
  function: Function;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: IReflectWebSocketOperationParameter[];
  imports: IReflectTypeImport[];
  description: string | null;
  jsDocTags: ts.JSDocTagInfo[];
}
