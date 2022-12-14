import { IFilesystemBucket } from "./IFilesystemBucket";
import { IFilesystemImageFile } from "./IFilesystemImageFile";
import { IFilesystemTextFile } from "./IFilesystemTextFile";
import { IFilesystemZipFile } from "./IFilesystemZipFile";

export type IFilesystemFile =
    | IFilesystemImageFile
    | IFilesystemTextFile
    | IFilesystemZipFile;
export namespace IFilesystemFile {
    export interface IBase<Extension extends string>
        extends IFilesystemBucket.IBase<"file"> {
        extension: Extension;
        size: number;
    }
}
