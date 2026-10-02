import { VERSION_NEUTRAL } from "@nestjs/common";
import { IJsDocTagInfo } from "typia";

import { IReflectController } from "./IReflectController";
import { IReflectImport } from "./IReflectImport";
import { ITypedWebSocketRouteParameter } from "./ITypedWebSocketRouteParameter";

/**
 * A typed WebSocket route: one path with its acceptor, header, path parameters,
 * query, and driver separated.
 *
 * @evidence contracts/common.md#principled-implementation The reflected operation is expanded per path and its parameters are classified.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ITypedWebSocketRoute describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
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
