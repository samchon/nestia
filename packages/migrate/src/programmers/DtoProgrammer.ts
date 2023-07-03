import { ISwagger } from "../structures/ISwagger";

export namespace DtoProgrammer {
    export const write = (swagger: ISwagger): void => {
        for (const [id, schema] of Object.entries(
            swagger.components.schemas ?? {},
        )) {
        }
    };
}
