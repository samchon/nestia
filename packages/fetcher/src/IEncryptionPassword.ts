import { IConnection } from "./IConnection";

/**
 * Encryption password.
 *
 * `IEncryptionPassword` is a type of interface who represents encryption
 * password used by the {@link Fetcher} with AES-128/256 algorithm. If your
 * encryption password is not fixed but changes according to the input content,
 * you can utilize the {@link IEncryptionPassword.Closure} function type.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @evidence contracts/common.md#principled-implementation A key and an initialization vector are the two inputs of AES-CBC, so the interface holds exactly them, as strings that `AesPkcs5` reads as UTF-8 bytes.
 * @evidence contracts/common.md#clear-and-simple-design A two-field record whose namespace adds the closure form for passwords that depend on the message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment says what the object represents and links the closure form.
 */
export interface IEncryptionPassword {
  /** Secret key. */
  key: string;

  /** Initialization Vector. */
  iv: string;
}
export namespace IEncryptionPassword {
  /**
   * Type of a closure function returning the {@link IEncryptionPassword} object.
   *
   * `IEncryptionPassword.Closure` is a type of closure function who are
   * returning the {@link IEncryptionPassword} object. It would be used when your
   * encryption password be changed according to the input content.
   *
   * @evidence contracts/common.md#principled-implementation A call signature from the message context to a password lets a server-driven scheme choose the key from the headers, the body, and the direction of each call.
   * @evidence contracts/common.md#clear-and-simple-design A callable interface with one signature and no members.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states when to use it and documents the parameter and the return value.
   */
  export interface Closure {
    /**
     * Encryption password getter.
     *
     * @param props Properties for predication
     * @returns Encryption password
     */
    (props: IProps): IEncryptionPassword;
  }

  /**
   * Properties for the closure.
   *
   * @evidence contracts/common.md#principled-implementation The record carries what a password closure can choose by: the request or response headers, the body text, and whether the body is being encoded or decoded.
   * @evidence contracts/common.md#clear-and-simple-design A three-field record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names it as the closure's properties; the direction values are self-descriptive.
   */
  export interface IProps {
    headers: Record<string, IConnection.HeaderValue | undefined>;
    body: string;
    direction: "encode" | "decode";
  }
}
