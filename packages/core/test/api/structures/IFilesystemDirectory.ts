import { IFilesystemBucket } from "./IFilesystemBucket";

export interface IFilesystemDirectory
    extends IFilesystemBucket.IBase<"directory"> {
    children: IFilesystemBucket[];
}
