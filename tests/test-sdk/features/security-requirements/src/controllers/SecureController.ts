import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiOAuth2, ApiSecurity } from "@nestjs/swagger";

/** Every route also accepts the controller's bearer alternative. */
@ApiSecurity("bearer")
@Controller("secure")
export class SecureController {
  /** Both the bearer token and the API key. */
  @ApiSecurity({ bearer: [], key: [] })
  @core.TypedRoute.Get("both")
  public both(): string {
    return "both";
  }

  /** Either scope. */
  @ApiOAuth2(["read"])
  @ApiOAuth2(["write"])
  @core.TypedRoute.Get("either")
  public either(): string {
    return "either";
  }

  /**
   * Both scopes, in one requirement.
   *
   * @security oauth2 read write
   */
  @core.TypedRoute.Get("scoped")
  public scoped(): string {
    return "scoped";
  }

  /**
   * Anonymous access is an alternative too.
   *
   * @security
   */
  @core.TypedRoute.Get("optional")
  public optional(): string {
    return "optional";
  }

  /** The controller's alternative, repeated, is listed once. */
  @ApiSecurity("bearer")
  @core.TypedRoute.Get("repeated")
  public repeated(): string {
    return "repeated";
  }
}
