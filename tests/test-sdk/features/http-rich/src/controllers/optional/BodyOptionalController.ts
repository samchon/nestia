import { PlainBody, TypedBody, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { v4 } from "uuid";

import { IBodyOptional } from "../../structures/optional/IBodyOptional";

@Controller("body_rich/optional/body/optional")
export class OptionalBodyOptionalController {
  @TypedRoute.Post("json")
  public json(@TypedBody() body?: IBodyOptional | undefined): IBodyOptional {
    return (
      body ?? {
        id: v4(),
        value: 1,
      }
    );
  }

  @TypedRoute.Post("plain")
  public plain(@PlainBody() body?: string): string {
    return body ?? "Hello, world!";
  }
}
