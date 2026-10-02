import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("param")
export class TypedParamController {
  /**
   * Composite path parameters.
   *
   * @param value The first value. The first string value.
   * @param value2 The second value. The second string value.
   * @returns Concatenated string.
   */
  @core.TypedRoute.Get(":value/composite/:value2")
  public composite(
    @core.TypedParam("value") value: string,
    @core.TypedParam("value2") value2: string,
  ): string {
    return value + value2;
  }

  /**
   * Boolean path parameter.
   *
   * @param value The boolean value. The boolean value as a path parameter.
   * @returns The same boolean value.
   */
  @core.TypedRoute.Get(":value/boolean")
  public boolean(@core.TypedParam("value") value: boolean): boolean {
    return value;
  }

  /** The number. */
  @core.TypedRoute.Get(":value/number")
  public number(
    /** Description in the parameter. */
    @core.TypedParam("value")
    value: number,
  ): number {
    return value;
  }

  /** The bigint. */
  @core.TypedRoute.Get(":value/bigint")
  public bigint(
    /** Description in the parameter. */
    @core.TypedParam("value")
    value: bigint,
  ): number {
    return Number(value);
  }

  /** The string. */
  @core.TypedRoute.Get(":value/string")
  public string(
    /**
     * Yoohoo
     *
     * @title Yaho
     */
    @core.TypedParam("value") value: string,
  ): string {
    return value;
  }

  @core.TypedRoute.Get(":value/nullable")
  public nullable(
    @core.TypedParam("value") value: string | null,
  ): string | null {
    return value;
  }

  @core.TypedRoute.Get(":value/literal")
  public literal(
    @core.TypedParam("value") value: "A" | "B" | "C",
  ): "A" | "B" | "C" {
    return value;
  }

  @core.TypedRoute.Get(":value/uuid")
  public uuid(
    @core.TypedParam("value") value: string & tags.Format<"uuid">,
  ): string {
    return value;
  }

  @core.TypedRoute.Get(":value/date")
  public date(
    @core.TypedParam("value") value: string & tags.Format<"date">,
  ): string {
    return value;
  }

  @core.TypedRoute.Get(":value/uuid_nullable")
  public uuid_nullable(
    @core.TypedParam("value") value: (string & tags.Format<"uuid">) | null,
  ): string | null {
    return value;
  }

  @core.TypedRoute.Get(":value/date_nullable")
  public date_nullable(
    @core.TypedParam("value") value: (string & tags.Format<"date">) | null,
  ): string | null {
    return value;
  }
}
