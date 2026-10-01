import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import {
  IDynamicQuery,
  IFilter,
  INativeQuery,
  INestedQuery,
  IUnionQuery,
} from "../api/structures/IPlainQuery";

/**
 * Vanilla `@Query()` parameters whose types a query string cannot carry. No
 * transform validates a vanilla decorator, so the SDK must hold them to the
 * rules `@TypedQuery()` enforces.
 */
@Controller("plain")
export class PlainQueryController {
  @core.TypedRoute.Get("nested")
  public nested(@Query() query: INestedQuery): void {
    query;
  }

  @core.TypedRoute.Get("dynamic")
  public dynamic(@Query() query: IDynamicQuery): void {
    query;
  }

  @core.TypedRoute.Get("union")
  public union(@Query() query: IUnionQuery): void {
    query;
  }

  @core.TypedRoute.Get("native")
  public native(@Query() query: INativeQuery): void {
    query;
  }

  @core.TypedRoute.Get("field")
  public field(@Query("filter") filter: IFilter): void {
    filter;
  }

  // a destructured parameter, whose diagnostic names its position
  @core.TypedRoute.Get("destructured")
  public destructured(@Query() { filter }: INestedQuery): void {
    filter;
  }

  @core.TypedRoute.Get("fields")
  public fields(@Query("filters") filters: IFilter[]): void {
    filters;
  }
}
