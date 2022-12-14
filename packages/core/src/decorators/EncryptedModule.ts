import { IEncryptionPassword } from "@nestia/fetcher/lib/IEncryptionPassword";
import { Module, ModuleMetadata } from "@nestjs/common";
import is_ts_node from "detect-ts-node";
import fs from "fs";

import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";

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
    metadata: ModuleMetadata,
    password: IEncryptionPassword | IEncryptionPassword.Closure,
): ClassDecorator {
    return function (target: any) {
        Module(metadata)(target);
        if (metadata.controllers === undefined) return;

        for (const controller of metadata.controllers)
            if (
                Reflect.hasMetadata(ENCRYPTION_METADATA_KEY, controller) ===
                false
            )
                Reflect.defineMetadata(
                    ENCRYPTION_METADATA_KEY,
                    password,
                    controller,
                );
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
     * @returns Class decorated module instance
     */
    export async function dynamic(
        path: string,
        password: IEncryptionPassword | IEncryptionPassword.Closure,
    ): Promise<object> {
        // LOAD CONTROLLERS
        const metadata: ModuleMetadata = {
            controllers: await controllers(path, password),
        };

        // RETURNS WITH DECORATING
        @EncryptedModule(metadata, password)
        class Module {}
        return Module;
    }

    async function controllers(
        path: string,
        password: IEncryptionPassword | IEncryptionPassword.Closure,
    ): Promise<any[]> {
        const output: any[] = [];
        await iterate(output, path);

        for (const controller of output)
            if (
                Reflect.hasMetadata(ENCRYPTION_METADATA_KEY, controller) ===
                false
            )
                Reflect.defineMetadata(
                    ENCRYPTION_METADATA_KEY,
                    password,
                    controller,
                );

        return output;
    }

    async function iterate(controllers: object[], path: string): Promise<void> {
        const directory: string[] = await fs.promises.readdir(path);
        for (const file of directory) {
            const current: string = `${path}/${file}`;
            const stats: fs.Stats = await fs.promises.lstat(current);

            if (stats.isDirectory() === true)
                await iterate(controllers, current);
            else if (file.substring(file.length - 3) === `.${EXTENSION}`) {
                const external: any = await import(current);
                for (const key in external) {
                    const instance: object = external[key];
                    if (Reflect.getMetadata("path", instance) !== undefined)
                        controllers.push(instance);
                }
            }
        }
    }
}
const EXTENSION = is_ts_node ? "ts" : "js";
