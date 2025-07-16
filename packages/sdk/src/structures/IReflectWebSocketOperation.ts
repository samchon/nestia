import { VERSION_NEUTRAL } from "@nestjs/common";
import ts from "typescript";

import { IReflectImport } from "./IReflectImport";
import { IReflectWebSocketOperationParameter } from "./IReflectWebSocketOperationParameter";

export interface IReflectWebSocketOperation {
  protocol: "websocket";
  name: string;
  paths: string[];
  function: Function;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  parameters: IReflectWebSocketOperationParameter[];
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: ts.JSDocTagInfo[];
}
