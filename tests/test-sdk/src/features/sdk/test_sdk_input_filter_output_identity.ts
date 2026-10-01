import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Verifies input filtering binds generated exclusions to each output identity.
 *
 * Installed bundle metadata may be shared, but retaining a first output in its
 * cache makes the second configuration compile its own generated files.
 *
 * 1. Create two SDK outputs, functional descendants and prefix-sharing siblings.
 * 2. Build independent and relative/link-spelled filters without compilation.
 * 3. Assert exact bundle/functional exclusion and eligibility of authored twins.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual filter factory excludes index.ts and functional descendants under each distinct output, accepts prefix-sharing siblings and same-named files outside that output, and agrees across relative/link spellings.
 * @evidence contracts/testing.md#independent-expectations SDK generation owns its bundle index.ts and functional subtree; authored controller files and sibling directories are outside those identities. Fixture paths establish this distinction without deriving expectations from the factory.
 * @evidence contracts/testing.md#distinguishing-cases Two sequential output factories distinguish the first-output cache defect. Functional descendants versus functional-neighbor and output-neighbor paths distinguish subtree boundaries. Relative/junction output spellings, no output and a declaration file cover identity and extension boundaries; explicit file discovery also obeys rejection.
 * @evidence contracts/testing.md#execution-ownership Unit: the named export directly calls the built input filter and SourceFinder over inert files. It starts no controller compiler, CLI, Nest host or installation and removes its unique root in finally.
 */
export const test_sdk_input_filter_output_identity =
  async (): Promise<void> => {
    const { SdkInputFilter } = require(
      path.resolve(
        process.cwd(),
        "../../packages/sdk/lib/utils/SdkInputFilter",
      ),
    ) as {
      SdkInputFilter: {
        create: (
          output: string | undefined,
        ) => Promise<(location: string) => Promise<boolean>>;
      };
    };
    const { SourceFinder } = require(
      path.resolve(process.cwd(), "../../packages/sdk/lib/utils/SourceFinder"),
    ) as {
      SourceFinder: {
        find: (props: {
          include: string[];
          filter: (file: string) => Promise<boolean>;
        }) => Promise<string[]>;
      };
    };
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "nestia-input-filter-"));
    try {
      const first = path.join(root, "first");
      const second = path.join(root, "second");
      const files = [
        "first/index.ts",
        "second/index.ts",
        "first/functional/R.ts",
        "second/functional/R.ts",
        "first/functional-neighbor/R.ts",
        "first-neighbor/index.ts",
        "first/authored.ts",
        "first/R.d.ts",
      ].map((relative) => path.join(root, relative));
      for (const file of files) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, "export interface R {}\n");
      }
      const a = await SdkInputFilter.create(first);
      const b = await SdkInputFilter.create(second);
      TestValidator.equals(
        "first output selection",
        await Promise.all(files.map(a)),
        [false, true, false, true, true, true, true, false],
      );
      TestValidator.equals(
        "second output selection",
        await Promise.all(files.map(b)),
        [true, false, true, false, true, true, true, false],
      );
      const relative = await SdkInputFilter.create(
        path.relative(process.cwd(), first),
      );
      TestValidator.equals(
        "relative output identity",
        await Promise.all(files.map(relative)),
        [false, true, false, true, true, true, true, false],
      );
      const alias = path.join(root, "alias");
      fs.symlinkSync(first, alias, "junction");
      const linked = await SdkInputFilter.create(alias);
      TestValidator.equals(
        "linked output identity",
        await Promise.all(files.map(linked)),
        [false, true, false, true, true, true, true, false],
      );
      const plain = await SdkInputFilter.create(undefined);
      TestValidator.equals(
        "no output extension selection",
        [await plain(files[0]!), await plain(files[7]!)],
        [true, false],
      );
      TestValidator.equals(
        "explicit generated input rejected",
        await SourceFinder.find({
          include: [files[0]!, files[2]!, files[6]!],
          filter: a,
        }),
        [files[6]!],
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
