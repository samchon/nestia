import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia, { tags } from "typia";

@nest.Controller("http_rich/clone/common/arraySimple")
export class CloneCommonArraySimpleController {
  @core.TypedRoute.Get()
  public index(): ArraySimple {
    return typia.random<ArraySimple>();
  }

  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: string & tags.Format<"uuid">): IPerson {
    id;
    return typia.random<IPerson>();
  }

  @core.TypedRoute.Post()
  public store(@core.TypedBody() body: IPerson): IPerson {
    return body;
  }
}

type ArraySimple = IPerson[];
interface IPerson {
  name: string;
  email: string;
  hobbies: IHobby[];
}
interface IHobby {
  name: string;
  body: string;
  rank: number;
}
