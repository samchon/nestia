import { IJsDocTagInfo } from "typia";

import { IReflectController } from "./IReflectController";
import { IReflectImport } from "./IReflectImport";
import { ITypedHttpRouteException } from "./ITypedHttpRouteException";
import { ITypedHttpRouteParameter } from "./ITypedHttpRouteParameter";
import { ITypedHttpRouteSuccess } from "./ITypedHttpRouteSuccess";

/**
 * A typed HTTP route: one path of an operation with its parameters split by
 * kind, its success, its exceptions, and its documentation.
 *
 * @evidence contracts/common.md#principled-implementation The reflected operation is expanded per path and its parameters are classified for the generators.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export interface ITypedHttpRoute {
  protocol: "http";
  function: Function;
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
  method: string;
  path: string;
  accessor: string[];

  // PARAMETERS
  pathParameters: ITypedHttpRouteParameter.IPath[];
  queryParameters: ITypedHttpRouteParameter.IQuery[];
  headerParameters: ITypedHttpRouteParameter.IHeaders[];
  queryObject: ITypedHttpRouteParameter.IQuery | null;
  headerObject: ITypedHttpRouteParameter.IHeaders | null;
  body: ITypedHttpRouteParameter.IBody | null;

  // RESPONSES
  success: ITypedHttpRouteSuccess;
  exceptions: Record<
    number | "2XX" | "3XX" | "4XX" | "5XX",
    ITypedHttpRouteException
  >;

  // ADDITIONAL INFORMATION
  security: Record<string, string[]>[];
  tags: string[];
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
  operationId: string | undefined;
  extensions?: Record<string, any>;
}
