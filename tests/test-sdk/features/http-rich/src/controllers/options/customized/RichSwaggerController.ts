import {
  SwaggerCustomizer,
  SwaggerExample,
  TypedParam,
  TypedRoute,
} from "@nestia/core";
import { Controller, Param } from "@nestjs/common";
import { tags } from "typia";

import { RichSelectorParam } from "./RichSelectorParam";

export interface RichReadonlyArrayObject {
  value: string;
}

export type richReadonlyMutableAlias = string[];

export interface RichIReadonlyArrayDto {
  mutable: string[];
  misleadingObject: RichReadonlyArrayObject;
  misleadingAlias: richReadonlyMutableAlias;
  readonlyArray: readonly string[];
  readonlyGeneric: ReadonlyArray<string>;
  readonly readonlyProperty: string[];
  readonly readonlyBoth: readonly string[];
}

export type RichIReadonlyArrayAliasDto = {
  mutable: string[];
  misleadingObject: RichReadonlyArrayObject;
  misleadingAlias: richReadonlyMutableAlias;
  readonlyArray: readonly string[];
  readonlyGeneric: ReadonlyArray<string>;
  readonly readonlyProperty: string[];
  readonly readonlyBoth: readonly string[];
};

@Controller("http_rich/options/customized/custom")
export class RichCustomController {
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    props.swagger.openapi = "3.2.11";
    props.route.description = "This is a custom description";
    (props.route as any)["x-special-symbol"] = "Something Special";

    const neighbor = props.get({
      method: "get",
      path: "http_rich/options/customized/custom/:id/normal",
    });
    if (neighbor) (neighbor as any)["x-special-symbol"] = "Something Normal";
  })
  @TypedRoute.Get(":key/:value/customize")
  public customize(
    @TypedParam("key")
    __key: number,
    @RichSelectorParam(() => RichCustomController.prototype.normal)
    @Param("value")
    __value: string,
  ): string {
    return `{ ${__key}: ${__value} }`;
  }

  @TypedRoute.Get(":id/normal")
  public normal(@TypedParam("id") id: string & tags.Format<"uuid">): string {
    return id.toString();
  }

  // Customizers run in the order they are declared from the method upwards,
  // so the move runs first and the edit then finds the moved operation.
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    (props.route as any)["x-after-move"] = true;
  })
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    const paths = props.swagger.paths!;
    paths["/http_rich/options/customized/custom/moved"] = paths[props.path]!;
    delete paths[props.path];
  })
  @TypedRoute.Get("movable")
  public movable(): string {
    return "movable";
  }

  // JSON has no bigint, so the example is written only after this converts it.
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    for (const parameter of props.route.parameters ?? [])
      if (typeof parameter.example === "bigint")
        parameter.example = parameter.example.toString();
  })
  @TypedRoute.Get("bigint/:value")
  public bigint(
    @SwaggerExample.Parameter(BigInt("12345678901234567890"))
    @TypedParam("value")
    value: bigint,
  ): string {
    return value.toString();
  }

  @TypedRoute.Get("readonly-array")
  public readonlyArray(): RichIReadonlyArrayDto {
    return {
      mutable: [],
      misleadingObject: { value: "ordinary object" },
      misleadingAlias: [],
      readonlyArray: [],
      readonlyGeneric: [],
      readonlyProperty: [],
      readonlyBoth: [],
    };
  }

  @TypedRoute.Get("readonly-array-alias")
  public readonlyArrayAlias(): RichIReadonlyArrayAliasDto {
    return {
      mutable: [],
      misleadingObject: { value: "ordinary object" },
      misleadingAlias: [],
      readonlyArray: [],
      readonlyGeneric: [],
      readonlyProperty: [],
      readonlyBoth: [],
    };
  }
}

@Controller("http_rich/options/customized/custom/inheritance/base")
export class RichInheritedSwaggerControllerBase {
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    (props.route as any)["x-metadata-base"] = true;
  })
  @TypedRoute.Get("route")
  public route(): string {
    return "base";
  }

  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    (props.route as any)["x-metadata-inherited"] = true;
  })
  @TypedRoute.Get("inherited")
  public inherited(): string {
    return "inherited";
  }

  public example(@SwaggerExample.Parameter("base") value: string): string {
    return value;
  }

  public inheritedExample(
    @SwaggerExample.Parameter("inherited") value: string,
  ): string {
    return value;
  }
}

@Controller("http_rich/options/customized/custom/inheritance/derived")
export class RichInheritedSwaggerController extends RichInheritedSwaggerControllerBase {
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    (props.route as any)["x-metadata-derived"] = true;
  })
  @TypedRoute.Get("route")
  public route(): string {
    return "derived";
  }

  public example(@SwaggerExample.Parameter("derived") value: string): string {
    return value;
  }
}
