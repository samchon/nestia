import { IEncryptionPassword } from "@nestia/fetcher/lib/IEncryptionPassword";
import { Module } from "@nestjs/common";

import { Creator } from "../typings/Creator";
import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";
import { load_controllers } from "./internal/load_controller";

/**
 * Encrypted module.
 *
 * `EncryptedModule` is an extension of the {@link Module} class decorator function
 * who configures encryption password of the AES-128/256 algorithm. The encryption
 * algorithm and password would be used by {@link EncryptedRoute} and {@link EncryptedBody}
 * to encrypt the request and response bod of the HTTP protocol.
 *
 * By using this `EncryptedModule` decorator function, all of the
 * {@link Controller controllers} configured in the *metadata* would be automatically
 * changed to the {@link EncryptedController} with the *password*. If there're some
 * original {@link EncryptedController} decorated classes in the *metadata*, their
 * encryption password would be kept.
 *
 * Therefore, if you're planning to place original {@link EncryptedController} decorated
 * classes in the *metadata*, I hope them to have different encryption password from the
 * module level. If not, I recommend you use the {@link Controller} decorator
 * function instead.
 *
 * In addition, the `EncryptedModule` supports a convenient dynamic controller importing
 * function, {@link EncryptedModule.dynamic}. If you utilize the function with directory
 * path of the controller classes, it imports and configures the controller classes into
 * the `Module`, automatically.
 *
 * @param metadata Module configuration metadata
 * @param password Encryption password or its getter function
 * @returns Class decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function EncryptedModule(
  metadata: Parameters<typeof Module>[0],
  password: IEncryptionPassword | IEncryptionPassword.Closure,
): ClassDecorator {
  return function (target: any) {
    Module(metadata)(target);
    if (metadata.controllers === undefined) return;

    for (const c of metadata.controllers)
      if (Reflect.hasMetadata(ENCRYPTION_METADATA_KEY, c) === false)
        Reflect.defineMetadata(ENCRYPTION_METADATA_KEY, password, c);
  };
}

export namespace EncryptedModule {
  /**
   * Dynamic encrypted module.
   *
   * `EncryptedModule.dynamic` is an extension of the {@link EncryptedModule} function
   * who configures controller classes by the dynamic importing. By specifying directory
   * path of the controller classes, those controllers would be automatically imported
   * and configured.
   *
   * @param path Directory path of the controller classes
   * @param password Encryption password or its getter function
   * @param options Additional options except controller
   * @returns Class decorated module instance
   */
  export async function dynamic(
    path: string | string[] | { include: string[]; exclude?: string[] },
    password: IEncryptionPassword | IEncryptionPassword.Closure,
    options: Omit<Parameters<typeof Module>[0], "controllers"> = {},
  ): Promise<object> {
    // LOAD CONTROLLERS
    const controllers: Creator<object>[] = await load_controllers(path);

    // RETURNS WITH DECORATING
    @EncryptedModule({ ...options, controllers }, password)
    class NestiaModule {}
    return NestiaModule;
  }
}
