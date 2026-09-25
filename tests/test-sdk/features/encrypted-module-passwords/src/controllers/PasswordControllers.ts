import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IPasswordEcho } from "@api/lib/structures/IPasswordEcho";

export const OWN_PASSWORD = { key: "O".repeat(32), iv: "o".repeat(16) };

/** A controller of the encrypted module itself. */
@Controller("plain")
export class PlainController {
  @core.EncryptedRoute.Post()
  public echo(@core.EncryptedBody() body: IPasswordEcho): IPasswordEcho {
    return body;
  }
}

/** Declares its own password, which the module must not replace. */
@core.EncryptedController("own", OWN_PASSWORD)
export class OwnController {
  @core.EncryptedRoute.Post()
  public echo(@core.EncryptedBody() body: IPasswordEcho): IPasswordEcho {
    return body;
  }
}

/** Inherits the own password of the controller it extends. */
@Controller("inherited")
export class InheritedController extends OwnController {}

/** Brought by a dynamic module import, `{ module, controllers }`. */
@Controller("dynamic")
export class DynamicController {
  @core.EncryptedRoute.Post()
  public echo(@core.EncryptedBody() body: IPasswordEcho): IPasswordEcho {
    return body;
  }
}

/** Brought by a `forwardRef()` import. */
@Controller("forward")
export class ForwardController {
  @core.EncryptedRoute.Post()
  public echo(@core.EncryptedBody() body: IPasswordEcho): IPasswordEcho {
    return body;
  }
}

/** Brought by one of two modules importing each other. */
@Controller("cyclic")
export class CyclicController {
  @core.EncryptedRoute.Post()
  public echo(@core.EncryptedBody() body: IPasswordEcho): IPasswordEcho {
    return body;
  }
}

/** Brought by a promised dynamic module import. */
@Controller("async")
export class AsyncController {
  @core.EncryptedRoute.Post()
  public echo(@core.EncryptedBody() body: IPasswordEcho): IPasswordEcho {
    return body;
  }
}
