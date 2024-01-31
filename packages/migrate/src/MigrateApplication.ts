import cp from "child_process";
import fs from "fs";
import typia from "typia";

import { MigrateAnalyzer } from "./analyzers/MigrateAnalyzer";
import { FileArchiver } from "./archivers/FileArchiver";
import { TEMPLATE } from "./bundles/TEMPLATE";
import { ApiProgrammer } from "./programmers/ApiProgrammer";
import { NestProgrammer } from "./programmers/NestProgrammer";
import { IMigrateFile } from "./structures/IMigrateFile";
import { IMigrateProgram } from "./structures/IMigrateProgram";
import { ISwagger } from "./structures/ISwagger";

export class MigrateApplication {
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
      this.program = MigrateAnalyzer.analyze(this.swagger);
    return this.program;
  }

  public write(): IMigrateFile[] {
    if (this.files === null) {
      this.program ??= this.analyze();
      this.files = [
        ...NestProgrammer.write(this.program),
        ...ApiProgrammer.write(this.program),
      ];
    }
    return this.files;
  }

  public async generate(output: string): Promise<void> {
    const files: IMigrateFile[] = this.write();
    const archiver = FileArchiver.archive({
      mkdir: fs.promises.mkdir,
      writeFile: (file, content) =>
        fs.promises.writeFile(file, content, "utf8"),
    })(output);
    try {
      cp.execSync(
        `git clone https://github.com/samchon/nestia-template "${output}"`,
        { stdio: "ignore" },
      );
      try {
        for (const path of [
          "/.git",
          "/src/api",
          "/src/controllers",
          "/src/providers",
          "/test/features",
        ])
          fs.rmSync(`${output}${path}`, {
            recursive: true,
            force: true,
          });
      } catch {}
    } catch {
      await archiver(TEMPLATE);
    }
    await archiver(files);
  }
}
export namespace NestiaMigrateApplication {
  export interface IArchiver {
    mkdir: (path: string) => void;
    writeFile: (path: string, content: string) => void;
  }
}
