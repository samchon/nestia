import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface INestedQueryOutput {
  nested: { value: string };
}

/**
 * A `@TypedQuery.Get()` response a query string cannot carry. The transform
 * must name the property and the rule, not only count the errors (#1717).
 */
@Controller("query")
export class NestedQueryRouteController {
  @core.TypedQuery.Get()
  public get(): INestedQueryOutput {
    return { nested: { value: "value" } };
  }
}
