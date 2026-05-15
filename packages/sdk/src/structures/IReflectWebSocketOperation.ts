import { VERSION_NEUTRAL } from "@nestjs/common";
import { IJsDocTagInfo } from "typia";

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
  jsDocTags: IJsDocTagInfo[];
}
