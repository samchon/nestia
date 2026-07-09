import cp from "child_process";

import { PackageManagerDetector } from "../../utils/PackageManagerDetector";
import { SdkManifest } from "../../utils/SdkManifest";

/** Composes and runs the `nestia dependencies` installation. */
export namespace DependenciesInstaller {
  /**
   * Composes the exact install command for the given package manager.
   *
   * `@nestia/e2e` and `@nestia/fetcher` are pinned to the running SDK's own
   * version line, and `typia` to the range `@nestia/sdk` itself declares, so a
   * fresh `npx @nestia/sdk dependencies` cannot pull an incompatible major from
   * the registry. Workspace-relative ranges (`catalog:`, `workspace:`) are not
   * installable from the registry, so `typia` falls back to unpinned in that
   * case — it only occurs inside this monorepo itself.
   *
   * Kept pure (inputs -> string[]) so unit tests can assert the command strings
   * without executing any install.
   */
  export const compose = (props: {
    manager: PackageManagerDetector.Manager;
    version: string;
    typia: string | undefined;
  }): string[] => {
    const specs: string[] = [
      `@nestia/e2e@^${props.version}`,
      `@nestia/fetcher@^${props.version}`,
      props.typia !== undefined && installable(props.typia)
        ? `typia@${props.typia}`
        : "typia",
    ];
    const prefix: string =
      props.manager === "npm" ? "npm install" : `${props.manager} add`;
    return [`${prefix} ${specs.join(" ")}`];
  };

  export const install = (props: {
    manager: PackageManagerDetector.Manager;
  }): void => {
    const manifest: SdkManifest.IManifest = SdkManifest.read();
    for (const command of compose({
      manager: props.manager,
      version: manifest.version,
      typia: manifest.dependencies.typia,
    })) {
      console.log(`\n$ ${command}`);
      cp.execSync(command, { stdio: "inherit" });
    }
  };

  const installable = (range: string): boolean =>
    !range.startsWith("catalog:") && !range.startsWith("workspace:");
}
