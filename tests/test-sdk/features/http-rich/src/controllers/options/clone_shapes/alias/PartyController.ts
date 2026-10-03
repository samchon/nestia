import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

import { CloneShapesAliasIParty } from "../../../../structures/clone_shapes/alias/CloneShapesAliasIParty";
import { CloneShapesAliasPartyId } from "../../../../structures/clone_shapes/alias/CloneShapesAliasPartyId";

@Controller("http_rich/options/clone_shapes/alias/parties")
export class CloneShapesAliasPartyController {
  @core.TypedRoute.Get(":partyId")
  public at(
    @core.TypedParam("partyId") partyId: CloneShapesAliasPartyId,
  ): CloneShapesAliasIParty {
    return { id: partyId, name: "party" };
  }

  @core.TypedRoute.Get("inline/:partyId")
  public inline(
    @core.TypedParam("partyId") partyId: string & tags.Format<"uuid">,
  ): CloneShapesAliasIParty {
    return { id: partyId, name: "party" };
  }

  @core.TypedRoute.Post()
  public create(
    @core.TypedBody() input: CloneShapesAliasIParty,
  ): CloneShapesAliasIParty {
    return input;
  }
}
