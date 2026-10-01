import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { IParty } from "../structures/IParty";
import { PartyId } from "../structures/PartyId";

@Controller("parties")
export class PartyController {
  @core.TypedRoute.Get(":partyId")
  public at(@core.TypedParam("partyId") partyId: PartyId): IParty {
    return { id: partyId, name: "party" };
  }

  @core.TypedRoute.Get("inline/:partyId")
  public inline(
    @core.TypedParam("partyId") partyId: string & tags.Format<"uuid">,
  ): IParty {
    return { id: partyId, name: "party" };
  }

  @core.TypedRoute.Post()
  public create(@core.TypedBody() input: IParty): IParty {
    return input;
  }
}
