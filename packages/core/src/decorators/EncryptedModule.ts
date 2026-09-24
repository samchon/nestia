import { IEncryptionPassword } from "@nestia/fetcher";
import { Module } from "@nestjs/common";

import { Creator } from "../typings/Creator";
import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";
import { load_controllers } from "./internal/load_controller";

/**
 * Encrypted module.
 *
 * `EncryptedModule` is an extension of the {@link Module} class decorator
 * function who configures encryption password of the AES-128/256 algorithm. The
 * encryption algorithm and password would be used by {@link EncryptedRoute} and
 * {@link EncryptedBody} to encrypt the request and response bod of the HTTP
 * protocol.
 *
 * By using this `EncryptedModule` decorator function, all of the
 * {@link Controller controllers} configured in the _metadata_ would be
 * automatically changed to the {@link EncryptedController} with the _password_,
 * and so would the controllers of every module it imports: module classes,
 * dynamic modules (`{ module, imports, controllers }`), `forwardRef()`s, and
 * promises of them, however deep and even when cyclic. If there're some
 * original {@link EncryptedController} decorated classes in the _metadata_,
 * their encryption password would be kept, as would a subclass's that inherits
 * one.
 *
 * Therefore, if you're planning to place original {@link EncryptedController}
 * decorated classes in the _metadata_, I hope them to have different encryption
 * password from the module level. If not, I recommend you use the
 * {@link Controller} decorator function instead.
 *
 * In addition, the `EncryptedModule` supports a convenient dynamic controller
 * importing function, {@link EncryptedModule.dynamic}. If you utilize the
 * function with directory path of the controller classes, it imports and
 * configures the controller classes into the `Module`, automatically.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @param metadata Module configuration metadata
 * @param password Encryption password or its getter function
 * @returns Class decorator
 */
export function EncryptedModule(
  metadata: Parameters<typeof Module>[0],
  password: IEncryptionPassword.Closure,
): ClassDecorator {
  return function (target: any) {
    Module(metadata)(target);
    iterate(password)(target);
  };
}

export namespace EncryptedModule {
  /**
   * Dynamic encrypted module.
   *
   * `EncryptedModule.dynamic` is an extension of the {@link EncryptedModule}
   * function who configures controller classes by the dynamic importing. By
   * specifying directory path of the controller classes, those controllers
   * would be automatically imported and configured.
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
    isTsNode?: boolean,
  ) {
    // LOAD CONTROLLERS
    const controllers: Creator<object>[] = await load_controllers(
      path,
      isTsNode,
    );

    // RETURNS WITH DECORATING
    @EncryptedModule(
      { ...options, controllers },
      typeof password === "object" ? () => password : password,
    )
    class NestiaModule {}
    return NestiaModule;
  }
}

/**
 * Gives every controller the module reaches the module's password: those of the
 * module itself and of each import, whether a module class, a dynamic module
 * (its `module`, and its own `imports` and `controllers`), a `forwardRef()`, or
 * a promise of one. Each module is visited once, so a cyclic import graph
 * terminates.
 *
 * @internal
 */
const iterate = (password: IEncryptionPassword.Closure) => {
  const visited: Set<object> = new Set();
  const controllers = (list: unknown): void => {
    if (Array.isArray(list))
      for (const c of list)
        if (typeof c === "function")
          Reflect.defineMetadata(ENCRYPTION_METADATA_KEY, password, c);
  };
  const imports = (list: unknown): void => {
    if (Array.isArray(list)) for (const imp of list) visit(imp);
  };
  const visit = (input: unknown): void => {
    if (
      typeof input !== "function" &&
      (typeof input !== "object" || input === null)
    )
      return;
    if (visited.has(input)) return;
    visited.add(input);

    if (typeof input === "function") {
      imports(Reflect.getMetadata("imports", input));
      controllers(Reflect.getMetadata("controllers", input));
    } else if (typeof (input as PromiseLike<unknown>).then === "function")
      // an asynchronous dynamic module; NestJS awaits the same promise while
      // scanning, after this callback, registered first, has run
      (input as PromiseLike<unknown>).then(visit, () => {});
    else if (typeof (input as IForwardReference).forwardRef === "function") {
      // the class a forward reference names may not be defined yet while the
      // decorators run; it is once the synchronous module graph has loaded
      const resolve = (): unknown => {
        try {
          return (input as IForwardReference).forwardRef();
        } catch {
          return undefined;
        }
      };
      const target: unknown = resolve();
      if (target !== undefined) visit(target);
      else void Promise.resolve().then(() => visit(resolve()));
    } else {
      const dynamic = input as {
        module?: unknown;
        imports?: unknown;
        controllers?: unknown;
      };
      visit(dynamic.module);
      imports(dynamic.imports);
      controllers(dynamic.controllers);
    }
  };
  return visit;
};

/** @internal */
interface IForwardReference {
  forwardRef: () => unknown;
}
