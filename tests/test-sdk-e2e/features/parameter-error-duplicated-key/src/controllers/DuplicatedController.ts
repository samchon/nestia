import core from "@nestia/core";
import { Controller, Headers, Query } from "@nestjs/common";

import { IDupHeaders, IDupQuery } from "../api/structures/IDuplicated";

/**
 * One wire key declared twice: by a field parameter and by the object parameter
 * of its category, or by two field parameters whose header names differ only by
 * case, which NestJS reads as the same header.
 */
@Controller("duplicated")
export class DuplicatedController {
  @core.TypedRoute.Get("query")
  public query(
    @Query("keyword") keyword: string,
    @core.TypedQuery() query: IDupQuery,
  ): void {
    keyword;
    query;
  }

  @core.TypedRoute.Get("headers")
  public headers(
    @Headers("X-Tenant") tenant: string,
    @core.TypedHeaders() headers: IDupHeaders,
  ): void {
    tenant;
    headers;
  }

  @core.TypedRoute.Get("fields")
  public fields(
    @Headers("x-trace") trace: string,
    @Headers("X-Trace") other: string,
  ): void {
    trace;
    other;
  }
}
