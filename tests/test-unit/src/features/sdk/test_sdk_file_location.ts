import path from "path";
import { pathToFileURL } from "url";

/**
 * Verifies the SDK reads a controller's source location back from a `file:` URL
 * as the path it names, with forward slashes.
 *
 * The URL was cut by hand, so a directory with a space or a non-ASCII character
 * came back percent-encoded and the file was not found.
 *
 * 1. Turn a path with a space and Korean characters into a `file:` URL.
 * 2. Assert the location reads back as that path, with forward slashes.
 * 3. Assert a plain path is returned as it is.
 *
 * @evidence contracts/testing.md#behavioral-verification It reads a percent-encoded `file:` URL through `PathUtil.location()` and asserts the decoded path with forward slashes, and that a plain path is returned as it is, which detects a location left percent-encoded.
 * @evidence contracts/testing.md#independent-expectations The expected path is the one the test built and turned into a URL with `pathToFileURL`, so the round trip is judged by the platform's own encoder.
 * @evidence contracts/testing.md#distinguishing-cases A directory with a space and Korean characters is the failing input and a plain relative path is the adjacent one that must stay unchanged.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared `test-unit` process and loads the built `@nestia/sdk` utility by absolute path; no controller is compiled and no application starts, which the E2E SDK suite owns.
 */
export const test_sdk_file_location = (): void => {
  const { PathUtil } = require(
    path.resolve(
      process.cwd(),
      "..",
      "..",
      "packages",
      "sdk",
      "lib",
      "utils",
      "PathUtil",
    ),
  ) as { PathUtil: { location: (str: string) => string } };

  const file: string = path.resolve(
    "space dir",
    "한글 폴더",
    "a b.controller.ts",
  );
  const url: string = pathToFileURL(file).href;
  if (url.includes("%20") === false)
    throw new Error(`the fixture URL is not percent-encoded: ${url}`);
  const expected: string = file.split(path.sep).join("/");
  if (PathUtil.location(url) !== expected)
    throw new Error(`${url} read back as ${PathUtil.location(url)}.`);
  if (PathUtil.location("src/a.ts") !== "src/a.ts")
    throw new Error("a plain path was altered.");
};
