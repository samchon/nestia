/**
 * Classifies the content type of a response.
 *
 * @evidence contracts/common.md#principled-implementation The namespace decides which content types the SDK supports and which are binary.
 * @evidence contracts/common.md#clear-and-simple-design One type and two predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is media types, not routes.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation HttpResponseContentTypeUtil classifies HTTP response metadata and MIME types, which have protocol semantics independent of the native filesystem.
 */
export namespace HttpResponseContentTypeUtil {
  /**
   * A response content type: JSON, text, urlencoded, another string, or `null`
   * for no body.
   *
   * @evidence contracts/common.md#principled-implementation The union keeps the common types visible while allowing any other string.
   * @evidence contracts/common.md#clear-and-simple-design One union.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the cases.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation HttpResponseContentTypeUtil.Response classifies HTTP response metadata and MIME types, which have protocol semantics independent of the native filesystem.
   */
  export type Response =
    | "application/json"
    | "text/plain"
    | "application/x-www-form-urlencoded"
    | (string & {})
    | null;

  /**
   * Reports whether the SDK supports the content type: none, JSON, plain text,
   * urlencoded, or a binary type.
   *
   * @evidence contracts/common.md#principled-implementation The content type is compared exactly for the three text types and by the binary rule otherwise.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The list is the supported set.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the supported types.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation HttpResponseContentTypeUtil.isSupported classifies HTTP response metadata and MIME types, which have protocol semantics independent of the native filesystem.
   */
  export const isSupported = (input: string | null): input is Response =>
    input === null ||
    input === "application/json" ||
    input === "text/plain" ||
    input === "application/x-www-form-urlencoded" ||
    isBinary(input);

  /**
   * Reports whether the content type is binary: an image, video, or audio type,
   * an octet stream, or a PDF.
   *
   * Parameters and case are ignored.
   *
   * @evidence contracts/common.md#principled-implementation The type is the text before the first `;`, trimmed and lower-cased, as HTTP defines a media type.
   * @evidence contracts/common.md#clear-and-simple-design One predicate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule is a list of media types.
   * @evidence contracts/common.md#meaningful-documentation The comment states the binary types and the normalization.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation HttpResponseContentTypeUtil.isBinary classifies HTTP response metadata and MIME types, which have protocol semantics independent of the native filesystem.
   */
  export const isBinary = (
    input: string | null | undefined,
  ): input is string => {
    if (typeof input !== "string") return false;

    const value: string = input.split(";")[0]!.trim().toLowerCase();
    return (
      value.startsWith("image/") ||
      value.startsWith("video/") ||
      value.startsWith("audio/") ||
      value === "application/octet-stream" ||
      value === "application/pdf"
    );
  };
}
