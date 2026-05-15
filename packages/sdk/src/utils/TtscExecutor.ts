import cp from "child_process";
import fs from "fs";
import path from "path";

export namespace TtscExecutor {
  export const run = (props: {
    cwd: string;
    project: string;
    stdio?: cp.StdioOptions;
  }): Buffer => {
    const args: string[] = [bin(), "-p", props.project];
    if (process.env.TTSC_CACHE_DIR !== undefined)
      args.push("--cache-dir", process.env.TTSC_CACHE_DIR);
    return cp.execFileSync(process.execPath, args, {
      cwd: props.cwd,
      stdio: props.stdio ?? "pipe",
      maxBuffer: 64 * 1024 * 1024,
    });
  };

  let bin_: string | undefined;

  const bin = (): string => {
    if (bin_ !== undefined) return bin_;

    const directory: string = path.dirname(
      require.resolve("ttsc/package.json"),
    );
    const pack: { bin?: string | Record<string, string> } = JSON.parse(
      fs.readFileSync(path.join(directory, "package.json"), "utf8"),
    );
    const location: string | undefined =
      typeof pack.bin === "string" ? pack.bin : pack.bin?.ttsc;
    if (location === undefined) {
      const keys =
        typeof pack.bin === "object" && pack.bin !== null
          ? Object.keys(pack.bin).join(", ")
          : "<none>";
      throw new Error(
        `Unable to find "ttsc" binary from package metadata. ` +
          `Available bin entries: ${keys}. ` +
          `Reinstall with: npm install --save-dev ttsc`,
      );
    }

    const resolved: string = path.join(directory, location);
    if (!fs.existsSync(resolved))
      throw new Error(
        `"ttsc" binary not found at "${resolved}". ` +
          `Reinstall with: npm install --save-dev ttsc`,
      );
    return (bin_ = resolved);
  };
}
