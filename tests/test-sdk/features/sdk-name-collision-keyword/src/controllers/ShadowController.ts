import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

import { IShadow } from "@api/lib/structures/IShadow";

/**
 * Parameters named after identifiers the generated SDK function, its `path()`,
 * or its `simulate()` also use: the method itself, the SDK's own parameters and
 * locals, the namespace members, imports, and globals those bodies reference.
 */
@Controller("shadow")
export class ShadowController {
  @core.TypedRoute.Get("query")
  public query(@core.TypedQuery() query: IShadow): IShadow {
    return query;
  }

  @core.TypedRoute.Post("body")
  public body(@core.TypedBody() body: IShadow): IShadow {
    return body;
  }

  @core.TypedRoute.Get("param/:param")
  public param(@core.TypedParam("param") param: string): string {
    return param;
  }

  @core.TypedRoute.Post("connect")
  public connect(@core.TypedBody() connection: IShadow): IShadow {
    return connection;
  }

  @core.TypedRoute.Get("connection")
  public connection(@core.TypedQuery() query: IShadow): IShadow {
    return query;
  }

  /**
   * Echo the shadow.
   *
   * @param props Shadow to echo
   */
  @core.TypedRoute.Get("props")
  public props(@core.TypedQuery() props: IShadow): IShadow {
    return props;
  }

  @core.TypedRoute.Get("optional")
  public optional(@core.TypedQuery() query?: IShadow.IOptional): IShadow {
    return { value: query?.value ?? "none" };
  }

  @core.TypedRoute.Get("imports")
  public imports(
    @Query("typia") typia: string,
    @Query("PlainFetcher") PlainFetcher: string,
    @Query("NestiaSimulator") NestiaSimulator: string,
  ): string[] {
    return [typia, PlainFetcher, NestiaSimulator];
  }

  @core.EncryptedRoute.Post("encrypted")
  public encrypted(@core.EncryptedBody() EncryptedFetcher: IShadow): IShadow {
    return EncryptedFetcher;
  }

  @core.TypedRoute.Get("locals/:key")
  public locals(
    @core.TypedParam("key") key: string,
    @Query("value") value: string,
    @Query("location") location: string,
    @Query("variables") variables: string,
    @Query("elem") elem: string,
  ): string[] {
    return [key, value, location, variables, elem];
  }

  @core.TypedRoute.Get("members/:path")
  public members(
    @core.TypedParam("path") path: string,
    @Query("random") random: string,
    @Query("METADATA") METADATA: string,
    @Query("assert") assert: string,
  ): string[] {
    return [path, random, METADATA, assert];
  }

  @core.TypedRoute.Get("globals/:encodeURIComponent")
  public globals(
    @core.TypedParam("encodeURIComponent") encodeURIComponent: string,
    @Query("Object") Object: string,
    @Query("String") String: string,
    @Query("Array") Array: string,
    @Query("URLSearchParams") URLSearchParams: string,
    @Query("undefined") undefined: string,
  ): string[] {
    return [
      encodeURIComponent,
      Object,
      String,
      Array,
      URLSearchParams,
      undefined,
    ];
  }

  /**
   * @setHeader value x-value
   * @assignHeaders headers
   */
  @core.TypedRoute.Get("output")
  public output(@Query("output") output: string): IShadow.IHeaders {
    return { value: output, headers: { "x-shadow": output } };
  }
}
