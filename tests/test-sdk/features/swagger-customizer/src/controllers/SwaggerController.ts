import { SwaggerCustomizer, TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Param } from "@nestjs/common";
import { tags } from "typia";

import { SelectorParam } from "../decorators/SelectorParam";

export interface IReadonlyArrayDto {
  mutable: string[];
  readonlyArray: readonly string[];
  readonlyGeneric: ReadonlyArray<string>;
  readonly readonlyProperty: string[];
  readonly readonlyBoth: readonly string[];
}

export type IReadonlyArrayAliasDto = {
  mutable: string[];
  readonlyArray: readonly string[];
  readonlyGeneric: ReadonlyArray<string>;
  readonly readonlyProperty: string[];
  readonly readonlyBoth: readonly string[];
};

@Controller("custom")
export class CustomController {
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    props.swagger.openapi = "3.2.11";
    props.route.description = "This is a custom description";
    (props.route as any)["x-special-symbol"] = "Something Special";

    const neighbor = props.get({
      method: "get",
      path: "custom/:id/normal",
    });
    if (neighbor) (neighbor as any)["x-special-symbol"] = "Something Normal";
  })
  @TypedRoute.Get(":key/:value/customize")
  public customize(
    @TypedParam("key")
    __key: number,
    @SelectorParam(() => CustomController.prototype.normal)
    @Param("value")
    __value: string,
  ): string {
    return `{ ${__key}: ${__value} }`;
  }

  @TypedRoute.Get(":id/normal")
  public normal(@TypedParam("id") id: string & tags.Format<"uuid">): string {
    return id.toString();
  }

  @TypedRoute.Get("readonly-array")
  public readonlyArray(): IReadonlyArrayDto {
    return {
      mutable: [],
      readonlyArray: [],
      readonlyGeneric: [],
      readonlyProperty: [],
      readonlyBoth: [],
    };
  }

  @TypedRoute.Get("readonly-array-alias")
  public readonlyArrayAlias(): IReadonlyArrayAliasDto {
    return {
      mutable: [],
      readonlyArray: [],
      readonlyGeneric: [],
      readonlyProperty: [],
      readonlyBoth: [],
    };
  }
}
