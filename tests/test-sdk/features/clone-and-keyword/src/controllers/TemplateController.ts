import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

@Controller("template")
export class TemplateController {
  @core.TypedRoute.Get()
  public index(): Template[] {
    return typia.random<Template[]>();
  }

  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: number): Template {
    id;
    return typia.random<Template>();
  }

  @core.TypedRoute.Post()
  public store(@core.TypedBody() body: Template): Template {
    return body;
  }
}

interface Template {
  prefix: `prefix_${string}`;
  postfix: `${string}_postfix`;
  middle_string: `the_${string}_value`;
  middle_string_empty: `the_${string}_value`;
  middle_numeric: `the_${number}_value`;
  middle_boolean: `the_${boolean}_value`;
  ipv4: `${number}.${number}.${number}.${number}`;
  email: `${string}@${string}.${string}`;
  combined: `the_${1 | 2 | 3}_value_with_label_${"A"}_${string}_${number}_4`;
  nosubstitution: `something`;
}
