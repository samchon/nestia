import { IEncryptionPassword } from "@nestia/fetcher/lib/IEncryptionPassword";
import { Controller } from "@nestjs/common";

import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";

/**
 * Encrypted controller.
 *
 * `EncryptedController` is an extension of the {@link nest.Controller} class decorator
 * function who configures encryption password of the AES-128/256 algorithm. The
 * encryption algorithm and password would be used by {@link EncryptedRoute} and
 * {@link EncryptedBody} to encrypt the request and response body of the HTTP protocol.
 *
 * By the way, you can configure the encryption password in the global level by using
 * {@link EncryptedModule} instead of the {@link nest.Module} in the module level. In
 * that case, you don't need to use this `EncryptedController` more. Just use the
 * {@link nest.Controller} without duplicated encryption password definitions.
 *
 * Of course, if you want to use different encryption password from the
 * {@link EncryptedModule}, this `EncryptedController` would be useful again. Therefore,
 * I recommend to use this `EncryptedController` decorator function only when you must
 * configure different encryption password from the {@link EncryptedModule}.
 *
 * @param path Path of the HTTP request
 * @param password Encryption password or its getter function
 * @returns Class decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function EncryptedController(
    path: string,
    password: IEncryptionPassword | IEncryptionPassword.Closure,
): ClassDecorator {
    return function (target: any) {
        Reflect.defineMetadata(ENCRYPTION_METADATA_KEY, password, target);
        Controller(path)(target);
    };
}
