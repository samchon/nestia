import { VERSION_NEUTRAL } from "@nestjs/common";
import ts from "typescript";

import { IReflectController } from "./IReflectController";
import { IReflectImport } from "./IReflectImport";
import { ITypedWebSocketRouteParameter } from "./ITypedWebSocketRouteParameter";

export interface ITypedWebSocketRoute {
  protocol: "websocket";
  controller: IReflectController;
  name: string;
  path: string;
  accessor: string[];
  function: Function;
  versions: Array<string | typeof VERSION_NEUTRAL> | undefined;
  acceptor: ITypedWebSocketRouteParameter.IAcceptor;
  header: ITypedWebSocketRouteParameter.IHeader | null;
  pathParameters: ITypedWebSocketRouteParameter.IParam[];
  query: ITypedWebSocketRouteParameter.IQuery | null;
  driver: ITypedWebSocketRouteParameter.IDriver | null;
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: ts.JSDocTagInfo[];
}
