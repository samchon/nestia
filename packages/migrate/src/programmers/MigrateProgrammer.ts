import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateDto } from "../structures/IMigrateDto";
import { IMigrateFile } from "../structures/IMigrateFile";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { ISwagger } from "../structures/ISwagger";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { ControllerProgrammer } from "./ControllerProgrammer";
import { DtoProgrammer } from "./DtoProgrammer";

export namespace MigrateProgrammer {
  export const analyze = (swagger: ISwagger): IMigrateProgram => {
    const controllers: IMigrateController[] =
      ControllerProgrammer.analyze(swagger);
    const structures: IMigrateDto[] = DtoProgrammer.analyze(swagger);
    return {
      controllers,
      structures,
    };
  };

  export const write =
    (components: ISwaggerComponents) =>
    (program: IMigrateProgram): IMigrateFile[] => {
      return [
        ...program.structures.map((s) => ({
          location: s.location,
          file: `${s.name}.ts`,
          content: DtoProgrammer.write(components)(s),
        })),
        ...program.controllers.map((c) => ({
          location: c.location,
          file: `${c.name}.ts`,
          content: ControllerProgrammer.write(components)(c),
        })),
        {
          location: "src",
          file: "MyModule.ts",
          content: MyModule(program.controllers),
        },
      ];
    };
}

const MyModule = (controllers: IMigrateController[]): string =>
  [
    `import { Module } from "@nestjs/common";`,
    ``,
    ...controllers.map(
      (c) =>
        `import { ${c.name} } from "${c.location.replace("src/", "./")}/${
          c.name
        }";`,
    ),
    ``,
    `@Module({`,
    `    controllers: [`,
    ...controllers.map((c) => `        ${c.name},`),
    `    ],`,
    `})`,
    `export class MyModule {}`,
  ].join("\n");
