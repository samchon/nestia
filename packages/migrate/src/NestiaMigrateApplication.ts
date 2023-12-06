import cp from "child_process";
import typia from "typia";

import { FileArchiver } from "./archivers/FileArchiver";
import { TEMPLATE } from "./bundles/TEMPLATE";
import { MigrateProgrammer } from "./programmers/MigrateProgrammer";
import { IMigrateFile } from "./structures/IMigrateFile";
import { IMigrateProgram } from "./structures/IMigrateProgram";
import { ISwagger } from "./structures/ISwagger";

export class NestiaMigrateApplication {
  public readonly swagger: ISwagger;
  private program: IMigrateProgram | null;
  private files: IMigrateFile[] | null;

  public constructor(swagger: ISwagger) {
    this.swagger = typia.assert(swagger);
    this.program = null;
    this.files = null;
  }

  public analyze(): IMigrateProgram {
    if (this.program === null)
      this.program = MigrateProgrammer.analyze(this.swagger);
    return this.program;
  }

  public write(): IMigrateFile[] {
    if (this.files === null) {
      const program: IMigrateProgram = this.analyze();
      this.files = MigrateProgrammer.write(this.swagger.components)(program);
    }
    return this.files;
  }

  public generate =
    (archiver: NestiaMigrateApplication.IArchiver) =>
    (output: string): void => {
      const program: IMigrateProgram = this.analyze();
      const files: IMigrateFile[] = MigrateProgrammer.write(
        this.swagger.components,
      )(program);

      try {
        cp.execSync(
          `git clone https://github.com/samchon/nestia-template "${output}"`,
          { stdio: "ignore" },
        );
        for (const path of [
          "/.git",
          "/src/api",
          "/src/controllers",
          "/src/providers",
          "/test/features",
        ])
          cp.execSync(`rm -rf "${output}${path}"`, {
            stdio: "ignore",
          });
      } catch {
        FileArchiver.archive(archiver)(output)(TEMPLATE);
      }
      FileArchiver.archive(archiver)(output)(files);
    };
}
export namespace NestiaMigrateApplication {
  export interface IArchiver {
    mkdir: (path: string) => void;
    writeFile: (path: string, content: string) => void;
  }
}
