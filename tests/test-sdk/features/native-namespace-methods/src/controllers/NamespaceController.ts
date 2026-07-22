import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export namespace North {
  @Controller("north")
  export class DuplicateController {
    @core.TypedRoute.Get("duplicate")
    public duplicate(): string {
      return "north";
    }
  }
}

export namespace South {
  @Controller("south")
  export class DuplicateController {
    @core.TypedRoute.Get("duplicate")
    public duplicate(): string {
      return "south";
    }
  }
}
