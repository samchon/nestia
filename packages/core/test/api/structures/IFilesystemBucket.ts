import { IFilesystemDirectory } from "./IFilesystemDirectory";
import { IFilesystemFile } from "./IFilesystemFile";
import { IPage } from "./IPage";

export type IFilesystemBucket = IFilesystemDirectory | IFilesystemFile;
export namespace IFilesystemBucket {
    export interface IBase<Type extends string> {
        type: Type;
        id: string;
        name: string;
    }

    export interface IRequest extends IPage.IRequest {
        extension?: string;
        trashed?: boolean;
    }
}
