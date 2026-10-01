import core from "@nestia/core";
import { Controller, Param } from "@nestjs/common";

import { IIdentifier } from "../api/structures/IPlainParam";

/**
 * Vanilla `@Param()` parameters whose types a path segment cannot carry. No
 * transform validates a vanilla decorator, so the SDK must hold them to the
 * rules `@TypedParam()` enforces.
 */
@Controller("plain")
export class PlainParamController {
  @core.TypedRoute.Get("object/:id")
  public object(@Param("id") id: IIdentifier): void {
    id;
  }

  @core.TypedRoute.Get("native/:id")
  public native(@Param("id") id: Set<string>): void {
    id;
  }

  @core.TypedRoute.Get("dynamic/:id")
  public dynamic(@Param("id") id: Record<string, string>): void {
    id;
  }

  @core.TypedRoute.Get("union/:id")
  public union(@Param("id") id: string | number): void {
    id;
  }
}
