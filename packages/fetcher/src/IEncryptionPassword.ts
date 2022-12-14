/**
 * Encryption password.
 *
 * `IEncryptionPassword` is a type of interface who represents encryption password used by
 * the {@link Fetcher} with AES-128/256 algorithm. If your encryption password is not fixed
 * but changes according to the input content, you can utilize the
 * {@link IEncryptionPassword.Closure} function type.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export interface IEncryptionPassword {
    /**
     * Secret key.
     */
    key: string;

    /**
     * Initialization vector.
     */
    iv: string;

    /**
     * Disable encryption to let content as plain.
     *
     * When you configure this `disabled` variable to be `false`, encryption and decryption
     * algorithm would be disabled. Therefore, content like request or response body
     * would be considered as a plain text instead.
     *
     * Default is `false`.
     */
    disabled?:
        | boolean
        | ((
              param: IEncryptionPassword.IParameter,
              encoded: boolean,
          ) => boolean);
}
export namespace IEncryptionPassword {
    /**
     * Type of a closure function returning the {@link IEncryptionPassword} object.
     *
     * `IEncryptionPassword.Closure` is a type of closure function who are returning the
     * {@link IEncryptionPassword} object. It would be used when your encryption password
     * be changed according to the input content.
     */
    export interface Closure {
        /**
         * Encryption password getter.
         *
         * @param param Request or response headers and body content
         * @param encoded Be encoded or to be decoded
         * @returns Encryption password
         */
        (param: IParameter, encoded: boolean): IEncryptionPassword;
    }

    /**
     * Parameter for the closure.
     */
    export interface IParameter {
        headers: Record<string, string>;
        body: string;
    }
}
