import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("arrayRecursive")
export class ArrayRecursiveController {
  @core.TypedRoute.Get()
  public index(): ICategory[] {
    return typia.random<ICategory[]>();
  }

  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: number): ICategory {
    id;
    return typia.random<ICategory>();
  }

  @core.TypedRoute.Post()
  public store(@core.TypedBody() body: ICategory): ICategory {
    return body;
  }
}

interface ICategory {
  children: ICategory[];
  id: number;
  code: string;
  sequence: number;
  created_at: ITimestamp;
}
interface ITimestamp {
  time: number;
  zone: number;
}
