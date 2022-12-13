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
     * Header values delivered to the remote HTTP server.
     */
    headers?: Record<string, string>;

    /**
     * Encryption password of its closure function.
     */
    encryption?: IEncryptionPassword | IEncryptionPassword.Closure;
}
