import { IRequestBodyValidation } from "./IRequestBodyValidation";

/**
 * The metadata `@WebSocketRoute()` writes on a method: its route paths.
 *
 * @evidence contracts/common.md#principled-implementation The record holds the paths, which the adapter turns into the route table; the parameter records are a separate metadata list.
 * @evidence contracts/common.md#clear-and-simple-design A one-member record and a namespace of the parameter record types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states which metadata the type describes.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
 */
export interface IWebSocketRouteReflect {
  paths: string[];
}
export namespace IWebSocketRouteReflect {
  /**
   * A parameter record: one of acceptor, driver, header, param, or query.
   *
   * @evidence contracts/common.md#principled-implementation The union is discriminated by the `category` literal, so the adapter can build the argument list with one comparison per parameter.
   * @evidence contracts/common.md#clear-and-simple-design A union of five records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the categories.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
   */
  export type IArgument = IAcceptor | IDriver | IHeader | IParam | IQuery;
  /**
   * The record of an acceptor parameter, which receives the WebSocket acceptor.
   *
   * @evidence contracts/common.md#principled-implementation The record has only the category and the position, because the adapter supplies the acceptor itself.
   * @evidence contracts/common.md#clear-and-simple-design It extends the shared base and adds nothing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states which argument it stands for.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
   */
  export interface IAcceptor extends IBase<"acceptor"> {}
  /**
   * The record of a driver parameter, which receives the remote driver of the
   * connection.
   *
   * @evidence contracts/common.md#principled-implementation The record has only the category and the position, because the adapter supplies the driver from the acceptor.
   * @evidence contracts/common.md#clear-and-simple-design It extends the shared base and adds nothing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states which argument it stands for.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
   */
  export interface IDriver extends IBase<"driver"> {}
  /**
   * The record of a header parameter: the position and the validator of the
   * handshake header.
   *
   * @evidence contracts/common.md#principled-implementation The callable retains its error-or-null signature. An optional resolver carries successful callback data to the route argument; legacy callbacks without it preserve the raw header and any validation error rejects the handshake.
   * @evidence contracts/common.md#clear-and-simple-design It extends the shared base with one function member.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states which argument it stands for and what the validator returns.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
   */
  export interface IHeader extends IBase<"header"> {
    /**
     * Validates the handshake header and returns an error, or `null` when it is
     * valid. Factory-owned callbacks also resolve successful data for the
     * decorated argument without replacing the acceptor's raw header.
     */
    validate: ((input?: any) => Error | null) &
      Pick<IRequestBodyValidation<any>, "resolve">;
  }
  /**
   * The record of a path parameter: its position, the field name, and the
   * conversion function.
   *
   * @evidence contracts/common.md#principled-implementation The field names the placeholder of the path, and the function converts the matched text to the declared type.
   * @evidence contracts/common.md#clear-and-simple-design It extends the shared base with two members.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states which argument it stands for.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
   */
  export interface IParam extends IBase<"param"> {
    field: string;
    /**
     * Converts the matched path text to the declared type, or throws.
     *
     * @evidence contracts/common.md#principled-implementation The function is the assertion the transform generated for the declared type, and a throw rejects the handshake.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
     * @evidence contracts/common.md#meaningful-documentation The comment states the conversion and the failure.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
     */
    assert: (value: string) => any;
  }
  /**
   * The record of a query parameter: the position and the validator of the
   * query string.
   *
   * @evidence contracts/common.md#principled-implementation The validator receives the `URLSearchParams` after the first question mark of the path and returns the typed object or an error.
   * @evidence contracts/common.md#clear-and-simple-design It extends the shared base with one function member.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states which argument it stands for.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
   */
  export interface IQuery extends IBase<"query"> {
    /**
     * Validates the query of the handshake and returns the typed object, or an
     * error.
     *
     * @evidence contracts/common.md#principled-implementation The function is the query decoder generated for the declared type, and an `Error` result rejects the handshake.
     * @evidence contracts/common.md#clear-and-simple-design One function member.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
     * @evidence contracts/common.md#meaningful-documentation The comment states the result.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation Handshake paths, parameter positions and callback signatures describe protocol metadata without native filesystem identities.
     */
    validate: (input: URLSearchParams) => any | Error;
  }

  interface IBase<Category extends string> {
    category: Category;
    index: number;
  }
}
