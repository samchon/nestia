import cp from "child_process";
import fs from "fs";
import path from "path";

export namespace TtscExecutor {
  export const run = (props: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    project: string;
    stdio?: cp.StdioOptions;
  }): Buffer => {
    const args: string[] = [bin(props.cwd), "-p", props.project];
    if (process.env.TTSC_CACHE_DIR !== undefined)
      args.push("--cache-dir", process.env.TTSC_CACHE_DIR);
    return cp.execFileSync(process.execPath, args, {
      cwd: props.cwd,
      env: {
        ...process.env,
        ...props.env,
      },
      stdio: props.stdio ?? "pipe",
      maxBuffer: 64 * 1024 * 1024,
    });
  };

  const bin_: Map<string, string> = new Map();

  const bin = (cwd: string): string => {
    const cached: string | undefined = bin_.get(cwd);
    if (cached !== undefined) return cached;

    // Prefer the user's project-local ttsc; fall back to the module's own
    // lookup path so a programmatic caller without an installed ttsc in
    // `cwd` still resolves the bundled dep.
    let manifest: string;
    try {
      manifest = require.resolve("ttsc/package.json", { paths: [cwd] });
    } catch {
      manifest = require.resolve("ttsc/package.json");
    }
    const directory: string = path.dirname(manifest);
    const pack: { bin?: string | Record<string, string> } = JSON.parse(
      fs.readFileSync(manifest, "utf8"),
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
    bin_.set(cwd, resolved);
    return resolved;
  };
}
