import { TypedQuery } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("query")
export class TypedQueryController {
  @TypedQuery.Get()
  public query(): IObject {
    return {
      name: "test",
    };
  }
}

interface IObject {
  name: string;
  age?: number;
}
