import { TypedQuery } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("query")
export class TypedQueryController {
  @TypedQuery.Get()
  public query(): IObject {
    return {
      name: "test",
      gender: 1,
    };
  }
}

interface IObject {
  name: string;
  gender: number | string;
}
