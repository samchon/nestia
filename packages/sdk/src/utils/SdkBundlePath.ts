import path from "path";

/** The installed API bundle shared by SDK emission and source exclusion. */
export const SDK_BUNDLE_PATH: string = path.join(
  __dirname,
  "..",
  "..",
  "assets",
  "bundle",
  "api",
);
