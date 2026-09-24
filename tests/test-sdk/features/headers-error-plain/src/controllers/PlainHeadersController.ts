import core from "@nestia/core";
import { Controller, Headers } from "@nestjs/common";

import {
  IDynamicHeaders,
  IMeta,
  INativeHeaders,
  INestedHeaders,
  INullableHeaders,
  IUnionHeaders,
} from "../api/structures/IPlainHeaders";

/**
 * Vanilla `@Headers()` parameters whose types headers cannot carry. No
 * transform validates a vanilla decorator, so the SDK must hold them to the
 * rules `@TypedHeaders()` enforces.
 */
@Controller("plain")
export class PlainHeadersController {
  @core.TypedRoute.Get("nested")
  public nested(@Headers() headers: INestedHeaders): void {
    headers;
  }

  @core.TypedRoute.Get("dynamic")
  public dynamic(@Headers() headers: IDynamicHeaders): void {
    headers;
  }

  @core.TypedRoute.Get("union")
  public union(@Headers() headers: IUnionHeaders): void {
    headers;
  }

  @core.TypedRoute.Get("nullable")
  public nullable(@Headers() headers: INullableHeaders): void {
    headers;
  }

  @core.TypedRoute.Get("native")
  public native(@Headers() headers: INativeHeaders): void {
    headers;
  }

  @core.TypedRoute.Get("field")
  public field(@Headers("x-meta") meta: IMeta): void {
    meta;
  }
}
