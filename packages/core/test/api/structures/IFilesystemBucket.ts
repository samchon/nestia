import { IFilesystemDirectory } from "./IFilesystemDirectory";
import { IFilesystemFile } from "./IFilesystemFile";

export type IFilesystemBucket = IFilesystemDirectory | IFilesystemFile;
export namespace IFilesystemBucket {
    export interface IBase<Type extends string> {
        type: Type;
        id: string;
        name: string;
    }
}
