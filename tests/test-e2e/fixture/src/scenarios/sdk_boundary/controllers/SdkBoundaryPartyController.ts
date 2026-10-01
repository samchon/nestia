import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { ISdkBoundaryParty } from "../structures/ISdkBoundaryParty";
import { SdkBoundaryPartyId } from "../structures/SdkBoundaryPartyId";

@Controller("sdk_boundary/parties")
export class SdkBoundaryPartyController {
  @core.TypedRoute.Get(":partyId")
  public at(
    @core.TypedParam("partyId") partyId: SdkBoundaryPartyId,
  ): ISdkBoundaryParty {
    return { id: partyId, name: "party" };
  }

  @core.TypedRoute.Get("inline/:partyId")
  public inline(
    @core.TypedParam("partyId") partyId: string & tags.Format<"uuid">,
  ): ISdkBoundaryParty {
    return { id: partyId, name: "party" };
  }

  @core.TypedRoute.Post()
  public create(@core.TypedBody() input: ISdkBoundaryParty): ISdkBoundaryParty {
    return input;
  }
}
