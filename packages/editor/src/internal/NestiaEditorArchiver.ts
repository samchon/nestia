import { strToU8, zipSync } from "fflate";

import { NESTIA_EDITOR_DEFAULT_PACKAGE } from "./NestiaEditorDefaultPackage";

/**
 * Archives a composed project into a zip file and hands it to the browser.
 *
 * StackBlitz can no longer run nestia projects: the generated projects build
 * through `ttsc`, whose TypeScript compiler is a native Go binary that a
 * WebContainer cannot execute. The editor therefore delivers the composed
 * project as a downloadable zip archive instead of an embedded StackBlitz
 * workspace.
 *
 * @evidence contracts/common.md#principled-implementation Packing is a synchronous zip of UTF-8 encoded entries through `fflate`, naming derives from the package name with a fixed character whitelist, and the download creates an object URL, clicks an anchor, and revokes the URL later.
 * @evidence contracts/common.md#clear-and-simple-design Three operations, each one browser or zip concern, in one namespace with no shared state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The archive is built with the library's public functions and the download uses the standard anchor mechanism; nothing is patched.
 * @evidence contracts/common.md#meaningful-documentation The namespace prose explains why the editor delivers a zip archive rather than an embedded workspace.
 */
export namespace NestiaEditorArchiver {
  /**
   * Pack the composed project files into a zip archive.
   *
   * @evidence contracts/common.md#principled-implementation Each file becomes one archive entry, with its text encoded by `strToU8` and the whole set compressed by `zipSync`, so the entry names are the given keys and the contents round-trip.
   * @evidence contracts/common.md#clear-and-simple-design One loop and one library call, without options.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It archives exactly the given files; no entry is added, filtered, or renamed.
   * @evidence contracts/common.md#meaningful-documentation The comment states the input and output.
   */
  export const pack = (files: Record<string, string>): Uint8Array => {
    const entries: Record<string, Uint8Array> = {};
    for (const [key, value] of Object.entries(files))
      entries[key] = strToU8(value);
    return zipSync(entries);
  };

  /**
   * Compose a safe archive file name from a package name.
   *
   * A leading `@` is dropped and every run of characters outside letters,
   * digits, `.`, `_`, and `-` becomes one `-`. A name with nothing left but
   * dots, such as an empty package name, would be a hidden file or a relative
   * path component, so the default package name is used instead.
   *
   * @evidence contracts/common.md#principled-implementation Dropping the `@` and replacing runs of characters outside the whitelist with one `-` yields a file name without path separators; a result of only dots would be a hidden file or a relative path component, so the default package name substitutes for it.
   * @evidence contracts/common.md#clear-and-simple-design One private helper applies the character rule to the package name and to the default, so the rule exists once.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule applies to every input; the only special case is the empty-name guard, which follows from the safe-name requirement.
   * @evidence contracts/common.md#meaningful-documentation The comment states the character rule and the dots-only fallback.
   */
  export const name = (packageName: string): string => {
    const base: string = compose(packageName);
    return `${/^\.*$/.test(base) ? compose(NESTIA_EDITOR_DEFAULT_PACKAGE) : base}.zip`;
  };

  const compose = (packageName: string): string =>
    packageName.replace(/^@/, "").replace(/[^A-Za-z0-9._-]+/g, "-");

  /**
   * Trigger a browser download of the packed archive.
   *
   * @evidence contracts/common.md#principled-implementation A Blob of the packed bytes is exposed through an object URL and an anchor with the `download` attribute is clicked, which is the browser's standard way to save generated content; the URL is revoked after 30 seconds so its memory is released.
   * @evidence contracts/common.md#clear-and-simple-design One function, kept apart from `pack` so packing stays testable outside a browser.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It uses the standard DOM and URL APIs; the delayed revocation is not a retry or a compensation.
   * @evidence contracts/common.md#meaningful-documentation The comment states that it triggers a browser download of the packed archive.
   */
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
