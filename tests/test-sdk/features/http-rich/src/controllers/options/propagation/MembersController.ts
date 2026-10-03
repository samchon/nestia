import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { PropagationIForbidden } from "../../../structures/propagation/PropagationIForbidden";
import { PropagationIMember } from "../../../structures/propagation/PropagationIMember";
import { PropagationINotFound } from "../../../structures/propagation/PropagationINotFound";

@Controller("http_rich/options/propagation/members")
export class PropagationMembersController {
  @core.TypedException<PropagationIForbidden>(403)
  @core.TypedException<PropagationINotFound>(404)
  @core.TypedException<PropagationIForbidden.IExpired>(422)
  @core.EncryptedRoute.Post("login")
  public login(
    @core.EncryptedBody() input: PropagationIMember.ILogin,
  ): PropagationIMember {
    input;
    return typia.random<PropagationIMember>();
  }
}
