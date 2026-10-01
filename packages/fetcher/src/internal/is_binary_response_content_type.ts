/**
 * Reports whether a response content type carries a binary body.
 *
 * The parameters of the type (`; charset=...`) and its case are ignored. Image,
 * video, and audio types, `application/octet-stream`, and `application/pdf` are
 * binary, and the fetcher returns their body as a stream instead of text.
 *
 * @evidence contracts/common.md#principled-implementation The media type is the text before the first `;`, trimmed and lower-cased as HTTP defines, and is matched against the binary families and two exact types, so a parameter or a case variant cannot change the decision.
 * @evidence contracts/common.md#clear-and-simple-design One predicate with a type guard, so the caller can narrow the route's content type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule is a list of media-type families from the HTTP registry rather than a list of routes.
 * @evidence contracts/common.md#meaningful-documentation The comment states the normalization and the binary types.
 */
export const is_binary_response_content_type = (
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
