import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

interface IQuery {
  name: string;
  age?: number;
}

@Controller("llm/query")
export class LlmQueryController {
  @TypedRoute.Get()
  public index(@TypedQuery() query: IQuery): void {
    query;
  }
}
