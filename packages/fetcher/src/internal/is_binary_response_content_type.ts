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
