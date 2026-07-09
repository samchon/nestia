import fs from "fs";
import path from "path";

/**
 * Reads the running `@nestia/sdk`'s own `package.json` at runtime, so that
 * installer commands can pin companion packages (`@nestia/fetcher`,
 * `@nestia/e2e`, `typia`, ...) to the exact version line this SDK was released
 * with, instead of pulling whatever the registry currently tags as latest.
 */
export namespace SdkManifest {
  export interface IManifest {
    version: string;
    dependencies: Record<string, string>;
  }

  export const read = (): IManifest => {
    const json: {
      version?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8"),
    );
    if (typeof json.version !== "string" || json.version.length === 0)
      throw new Error("Unable to resolve @nestia/sdk's own version.");
    return {
      version: json.version,
      dependencies: {
        ...(json.devDependencies ?? {}),
        ...(json.dependencies ?? {}),
      },
    };
  };
}
