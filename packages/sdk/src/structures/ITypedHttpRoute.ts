import { IJsDocTagInfo } from "typia";

import { IReflectController } from "./IReflectController";
import { IReflectImport } from "./IReflectImport";
import { ITypedHttpRouteException } from "./ITypedHttpRouteException";
import { ITypedHttpRouteParameter } from "./ITypedHttpRouteParameter";
import { ITypedHttpRouteSuccess } from "./ITypedHttpRouteSuccess";

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
