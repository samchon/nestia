import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiOAuth2,
  ApiSecurity,
} from "@nestjs/swagger";
import typia from "typia";

import { IToken } from "@api/lib/structures/IToken";

@Controller()
export class SecurityController {
  @ApiBasicAuth()
  @core.TypedRoute.Get("basic")
  public basic(): IToken {
    return typia.random<IToken>();
  }

  /**
   * @security basic
   */
  @core.TypedRoute.Get("basic_by_comment")
  public basic_by_comment(): IToken {
    return typia.random<IToken>();
  }

  @ApiBearerAuth()
  @core.TypedRoute.Get("bearer")
  public bearer(): IToken {
    return typia.random<IToken>();
  }

  /**
   * @security bearer
   */
  @core.TypedRoute.Get("bearer_by_comment")
  public bearer_by_comment(): IToken {
    return typia.random<IToken>();
  }

  @ApiOAuth2(["write:pets", "read:pets"])
  @core.TypedRoute.Get("oauth2")
  public oauth2(): IToken {
    return typia.random<IToken>();
  }

  /**
   * @security oauth2 write:pets read:pets
   */
  @core.TypedRoute.Get("oauth2_by_comment")
  public oauth2_by_comment(): IToken {
    return typia.random<IToken>();
  }

  /**
   * @security
   * @security bearer
   */
  @core.TypedRoute.Get("optional_by_comment")
  public optional_by_comment(): IToken {
    return typia.random<IToken>();
  }

  @core.TypedRoute.Get("security")
  public security(): IToken {
    return typia.random<IToken>();
  }
}
