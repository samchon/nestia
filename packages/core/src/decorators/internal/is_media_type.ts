/** @internal */
export const is_media_type = (
  text: string | undefined,
  expected: string,
): boolean =>
  text !== undefined &&
  text
    .split(";")
    .map((str) => str.trim().toLowerCase())
    .some((str) => str === expected.toLowerCase());
