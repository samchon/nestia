import { ISwagger } from "../structures/ISwagger";
import { RouteDirectory } from "../structures/RouteDirectory";
import { DirectoryProgrammer } from "./DirectoryProgrammer";

export namespace MigrateProgrammer {
    export const write = (swagger: ISwagger) => {
        const directory: RouteDirectory = DirectoryProgrammer.write(swagger);
    };
}
