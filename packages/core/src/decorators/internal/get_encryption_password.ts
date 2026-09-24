import { IEncryptionPassword } from "@nestia/fetcher";

import {
  ENCRYPTION_CONTROLLER_METADATA_KEY,
  ENCRYPTION_METADATA_KEY,
} from "./EncryptedConstant";

/**
 * The encryption password of a controller class. The password its own
 * `@EncryptedController()` declares, which a subclass inherits, precedes the
 * one an `EncryptedModule` gave it: the more specific declaration wins.
 *
 * @internal
 */
export const get_encryption_password = (
  target: Function,
): IEncryptionPassword | IEncryptionPassword.Closure | undefined =>
  Reflect.getMetadata(ENCRYPTION_CONTROLLER_METADATA_KEY, target) ??
  Reflect.getMetadata(ENCRYPTION_METADATA_KEY, target);
