import core from "@nestia/core";
import * as nest from "@nestjs/common";
import { tags } from "typia";

@nest.Controller("http_rich/clone/common/objectLiteral")
export class CloneCommonObjectLiteralController {
  @core.TypedRoute.Get()
  public index(): ObjectLietral[] {
    return [];
  }

  @core.TypedRoute.Get("literal")
  public literals(): Array<{
    id: string;
    member: {
      id: string & tags.Format<"uuid">;
      email: string & tags.Format<"email">;
      age: number & tags.Type<"uint32">;
    };
    created_at: string & tags.Format<"date-time">;
  }> {
    return [];
  }
}

interface ObjectLietral {
  id: string;
  member: {
    id: string & tags.Format<"uuid">;
    email: string & tags.Format<"email">;
    age: number & tags.Type<"uint32">;
  };
  created_at: string & tags.Format<"date-time">;
}
