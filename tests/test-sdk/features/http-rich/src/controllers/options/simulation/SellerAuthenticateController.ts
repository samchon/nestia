import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

import { SimulationISeller } from "../../../structures/simulation/SimulationISeller";

@nest.Controller("http_rich/options/simulation/sellers/authenticate")
export class SimulationSellerAuthenticateController {
  /**
   * Join as a seller.
   *
   * @param input Information of yours
   * @returns Information of newly joined seller
   * @setHeader authorization.token Authorization
   */
  @core.EncryptedRoute.Post("join")
  public async join(
    @core.EncryptedBody() input: SimulationISeller.IJoin,
  ): Promise<SimulationISeller.IAuthorized> {
    return {
      ...typia.random<SimulationISeller.IAuthorized>(),
      email: input.email,
      name: input.name,
      mobile: input.mobile,
      company: input.company,
    };
  }

  /**
   * Log-in as a seller.
   *
   * @param input Email and password
   * @returns Information of the seller
   * @assignHeaders authorization
   */
  @core.EncryptedRoute.Post("login")
  public async login(
    @core.EncryptedBody() input: SimulationISeller.ILogin,
  ): Promise<SimulationISeller.IAuthorized> {
    return {
      ...typia.random<SimulationISeller.IAuthorized>(),
      email: input.email,
    };
  }

  /**
   * Change password.
   *
   * @param input Old and new passwords
   * @returns Empty object
   */
  @nest.Patch("password/change")
  public async change(
    @core.EncryptedBody() input: SimulationISeller.IChangePassword,
  ): Promise<void> {
    input;
  }

  /** Erase the seller by itself. */
  @nest.Delete("exit")
  public async exit(): Promise<void> {}
}
