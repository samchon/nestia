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

// Config discovery receives exported controller values, while the AST method
// declarations retain their DuplicateController namespace parents.
export const NorthController = North.DuplicateController;
export const SouthController = South.DuplicateController;
