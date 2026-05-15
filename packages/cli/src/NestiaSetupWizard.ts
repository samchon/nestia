import cp from "child_process";
import fs from "fs";

type Manager = "npm" | "pnpm" | "yarn" | "bun";

const ADD: Record<Manager, string> = {
  npm: "npm install",
  pnpm: "pnpm add",
  yarn: "yarn add",
  bun: "bun add",
};

const DEV: Record<Manager, string> = {
  npm: "-D",
  pnpm: "-D",
  yarn: "-D",
  bun: "-d",
};

const TAG = "next";

export namespace NestiaSetupWizard {
  export async function setup(argv: string[]): Promise<void> {
    if (!fs.existsSync("package.json")) {
      console.error(
        [
          `npx nestia setup must be run inside a project that already has a package.json.`,
          `Create one with "npm init -y" and re-run.`,
        ].join("\n"),
      );
      process.exit(1);
    }

    const manager: Manager = pick(argv);

    console.log("----------------------------------------");
    console.log(" Nestia Setup Wizard");
    console.log("----------------------------------------");
    console.log(`package manager : ${manager}`);
    console.log("");

    install(manager, true, "ttsc", "@typescript/native-preview");
    install(manager, false, tagged("typia"));
    install(
      manager,
      false,
      tagged("@nestia/core"),
      tagged("@nestia/sdk"),
      tagged("@nestia/fetcher"),
    );
    install(manager, true, tagged("nestia"));

    console.log("----------------------------------------");
    console.log(" Nestia setup complete.");
    console.log("----------------------------------------");
    console.log("Next: see https://nestia.io/docs/setup/tsgo");
    console.log("");

    const go = cp.spawnSync("go", ["version"], { stdio: "ignore" });
    if (go.status !== 0 && !process.env.TTSC_GO_BINARY) {
      console.warn(
        [
          "Heads up: Go 1.26+ was not found on PATH.",
          "Install it (https://go.dev/dl) or set TTSC_GO_BINARY before running ttsc;",
          "the @nestia/core native transform binary is built on demand at first compile.",
        ].join("\n"),
      );
    }
  }

  function install(
    manager: Manager,
    dev: boolean,
    ...modules: string[]
  ): void {
    const command: string = [ADD[manager], dev ? DEV[manager] : "", ...modules]
      .filter((s) => s.length !== 0)
      .join(" ");
    console.log(`$ ${command}`);
    cp.execSync(command, { stdio: "inherit" });
    console.log("");
  }

  function tagged(name: string): string {
    return `${name}@${TAG}`;
  }

  function pick(argv: string[]): Manager {
    for (let i = 0; i < argv.length; ++i) {
      const token: string | undefined = argv[i];
      if (token === undefined) continue;
      if (token === "--manager") return ensure(argv[i + 1]);
      if (token.startsWith("--manager="))
        return ensure(token.slice("--manager=".length));
    }
    if (fs.existsSync("bun.lockb") || fs.existsSync("bun.lock")) return "bun";
    if (fs.existsSync("pnpm-lock.yaml")) return "pnpm";
    if (fs.existsSync("yarn.lock")) return "yarn";
    return "npm";
  }

  function ensure(value: string | undefined): Manager {
    if (
      value === "npm" ||
      value === "pnpm" ||
      value === "yarn" ||
      value === "bun"
    )
      return value;
    console.error(
      [
        `--manager requires one of: npm | pnpm | yarn | bun.`,
        `Use either "--manager <name>" or "--manager=<name>".`,
      ].join("\n"),
    );
    process.exit(1);
  }
}
