import { strToU8, zipSync } from "fflate";

/**
 * Archives a composed project into a zip file and hands it to the browser.
 *
 * StackBlitz can no longer run nestia projects: the generated projects build
 * through `ttsc`, whose TypeScript compiler is a native Go binary that a
 * WebContainer cannot execute. The editor therefore delivers the composed
 * project as a downloadable zip archive instead of an embedded StackBlitz
 * workspace.
 */
export namespace NestiaEditorArchiver {
  /** Pack the composed project files into a zip archive. */
  export const pack = (files: Record<string, string>): Uint8Array => {
    const entries: Record<string, Uint8Array> = {};
    for (const [key, value] of Object.entries(files))
      entries[key] = strToU8(value);
    return zipSync(entries);
  };

  /** Compose a safe archive file name from a package name. */
  export const name = (packageName: string): string =>
    `${packageName.replace(/^@/, "").replace(/[^A-Za-z0-9._-]+/g, "-")}.zip`;

  /** Trigger a browser download of the packed archive. */
  export const download = (props: {
    name: string;
    files: Record<string, string>;
  }): void => {
    const blob: Blob = new Blob(
      [pack(props.files) as Uint8Array<ArrayBuffer>],
      {
        type: "application/zip",
      },
    );
    const url: string = URL.createObjectURL(blob);
    const anchor: HTMLAnchorElement = window.document.createElement("a");
    anchor.href = url;
    anchor.download = props.name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
}
