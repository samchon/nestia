import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies source discovery follows linked directories once and terminates
 * cycles.
 *
 * A linked input may be the only route to a controller, while an ancestor link
 * must not cause recursion until the filesystem refuses a deeply repeated
 * path.
 *
 * 1. Create two links to an external directory and an ancestor cycle.
 * 2. Find files through the root and compare their filesystem identities.
 * 3. Exclude through the other alias and verify that the same file is removed.
 *
 * @evidence contracts/testing.md#behavioral-verification The finder must return the one linked source once, terminate the ancestor loop, and remove it when excluded through a different link spelling.
 * @evidence contracts/testing.md#independent-expectations The fixture creates exactly one accepted source; realpath resolves its independently authored identity, and the alternate link names the same source.
 * @evidence contracts/testing.md#distinguishing-cases Linked-only discovery is the positive case, the ancestor loop and repeated alias must not duplicate traversal, and an exclude through the second alias is the identity boundary. An unmatched extension is not returned.
 * @evidence contracts/testing.md#execution-ownership Unit: this named export calls the built source finder directly on a temporary filesystem and releases its unique root in finally; there is no compiler or product host.
 */
export const test_sdk_source_finder_link_cycles = async (): Promise<void> => {
  const { SourceFinder } = require(
    path.resolve(process.cwd(), "../../packages/sdk/lib/utils/SourceFinder"),
  ) as {
    SourceFinder: {
      find: (props: {
        include: string[];
        exclude?: string[];
        filter: (file: string) => Promise<boolean>;
      }) => Promise<string[]>;
    };
  };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-finder-links-"));
  try {
    const input = path.join(root, "input");
    const target = path.join(root, "external");
    fs.mkdirSync(input);
    fs.mkdirSync(target);
    const source = path.join(target, "Controller.ts");
    fs.writeFileSync(source, "export class Controller {}\n");
    fs.writeFileSync(path.join(target, "ignored.txt"), "ignored");
    fs.symlinkSync(target, path.join(input, "first"), "junction");
    fs.symlinkSync(target, path.join(input, "second"), "junction");
    fs.symlinkSync(input, path.join(target, "cycle"), "junction");
    const filter = (file: string): Promise<boolean> =>
      Promise.resolve(file.endsWith(".ts"));
    const found = await SourceFinder.find({ include: [input], filter });
    TestValidator.equals(
      "one linked file",
      found.map((file) => fs.realpathSync.native(file)),
      [fs.realpathSync.native(source)],
    );
    TestValidator.equals(
      "exclude by identity",
      await SourceFinder.find({
        include: [input],
        exclude: [path.join(input, "second")],
        filter,
      }),
      [],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};
