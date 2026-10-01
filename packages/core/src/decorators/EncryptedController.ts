import { IEncryptionPassword } from "@nestia/fetcher";
import { Controller } from "@nestjs/common";

import { ENCRYPTION_CONTROLLER_METADATA_KEY } from "./internal/EncryptedConstant";

/**
 * Encrypted controller.
 *
 * `EncryptedController` is an extension of the {@link nest.Controller} class
 * decorator function who configures encryption password of the AES-128/256
 * algorithm. The encryption algorithm and password would be used by
 * {@link EncryptedRoute} and {@link EncryptedBody} to encrypt the request and
 * response body of the HTTP protocol.
 *
 * By the way, you can configure the encryption password in the global level by
 * using {@link EncryptedModule} instead of the {@link nest.Module} in the module
 * level. In that case, you don't need to use this `EncryptedController` more.
 * Just use the {@link nest.Controller} without duplicated encryption password
 * definitions.
 *
 * Of course, if you want to use different encryption password from the
 * {@link EncryptedModule}, this `EncryptedController` would be useful again.
 * Therefore, I recommend to use this `EncryptedController` decorator function
 * only when you must configure different encryption password from the
 * {@link EncryptedModule}.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @param path Path of the HTTP request
 * @param password Encryption password or its getter function
 * @returns Class decorator
 * @evidence contracts/common.md#principled-implementation The decorator stores the password as metadata on the class and then applies Nest's `Controller(path)`, so the encrypted decorators can find the password by reading the class.
 * @evidence contracts/common.md#clear-and-simple-design One decorator that composes a metadata write with the standard decorator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses Nest's public `Controller` decorator and the reflect metadata API.
 * @evidence contracts/common.md#meaningful-documentation The comment states the password forms and the encrypted decorators it enables.
 */
export function EncryptedController(
  path: string,
  password: IEncryptionPassword | IEncryptionPassword.Closure,
): ClassDecorator {
  return function (target: any) {
    Reflect.defineMetadata(
      ENCRYPTION_CONTROLLER_METADATA_KEY,
      password,
      target,
    );
    Controller(path)(target);
  };
}
