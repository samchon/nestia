import { IMigrateFile } from "../structures/IMigrateFile";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { ISwagger } from "../structures/ISwagger";
import { ControllerProgrammer } from "./ControllerProgrammer";
import { DtoProgrammer } from "./DtoProgrammer";

export namespace MigrateProgrammer {
    export const analyze = (swagger: ISwagger): IMigrateProgram => {
        const controllers = ControllerProgrammer.analyze(swagger);
        const structures = DtoProgrammer.analyze(swagger);
        return {
            controllers,
            structures,
        };
    };

    export const write = (program: IMigrateProgram): IMigrateFile[] => {
        return [
            ...program.controllers.map((c) => ({
                location: c.location,
                file: `${c.name}.ts`,
                content: ControllerProgrammer.write(c),
            })),
            ...program.structures.map((s) => ({
                location: s.location,
                file: `${s.name}.ts`,
                content: DtoProgrammer.write(s),
            })),
        ];
    };
}
