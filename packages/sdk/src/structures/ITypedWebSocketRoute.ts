import { VERSION_NEUTRAL } from "@nestjs/common";
import { IJsDocTagInfo } from "typia";

import { IReflectController } from "./IReflectController";
import { IReflectImport } from "./IReflectImport";
import { ITypedWebSocketRouteParameter } from "./ITypedWebSocketRouteParameter";

export interface ITypedWebSocketRoute {
  protocol: "websocket";
  controller: IReflectController;
  /**
   * Property key of the controller method.
   *
   * {@link name} is the SDK function's name, which the accessor analysis
   * renames: a reserved word such as `delete` becomes `_delete`. Metadata the
   * method's decorators define, and what names the method, read this key.
   */
  key: string;
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
  jsDocTags: IJsDocTagInfo[];
}
