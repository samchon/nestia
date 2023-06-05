import { IEncryptionPassword } from "./IEncryptionPassword";

/**
 * Connection information.
 *
 * `IConnection` is a type of interface who represents connection information of the remote
 * HTTP server. You can target the remote HTTP server by wring the {@link IConnection.host}
 * variable down. Also, you can configure special header values by specializing the
 * {@link IConnection.headers} variable.
 *
 * If the remote HTTP server encrypts or decrypts its body data through the AES-128/256
 * algorithm, specify the {@link IConnection.encryption} with {@link IEncryptionPassword}
 * or {@link IEncryptionPassword.Closure} variable.
 *
 * @author Jenogho Nam - https://github.com/samchon
 */
export interface IConnection {
    /**
     * Host address of the remote HTTP server.
     */
    host: string;

    /**
     * Use `typia.random<T>()` function instead.
     *
     * If you configure this property to be `true`, your SDK library does not send
     * any request to remote backend server, but just returns a random data generated
     * by `typia.random<T>()` function.
     *
     * By the way, to utilize this random property, SDK library must be generated with
     * `random` option, too. Open `nestia.config.ts` file, and configure `random: true`
     * property in the top level. Then newly generated SDK library would have a
     * built-in random generator.
     *
     * @default false
     */
    random?: boolean;

    /**
     * Header values delivered to the remote HTTP server.
     */
    headers?: Record<string, string>;

    /**
     * Encryption password of its closure function.
     */
    encryption?: IEncryptionPassword | IEncryptionPassword.Closure;
}
