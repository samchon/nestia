export namespace HttpResponseContentTypeUtil {
  export type Response =
    | "application/json"
    | "text/plain"
    | "application/x-www-form-urlencoded"
    | (string & {})
    | null;

  export const isSupported = (input: string | null): input is Response =>
    input === null ||
    input === "application/json" ||
    input === "text/plain" ||
    input === "application/x-www-form-urlencoded" ||
    isBinary(input);

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
