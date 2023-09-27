import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("arrayRecursiveUnionExplicit")
export class ArrayRecursiveUnionExplicitController {
    @core.TypedRoute.Get()
    public index(): ArrayRecursiveUnionExplicit {
        return typia.random<ArrayRecursiveUnionExplicit>();
    }

    @core.TypedRoute.Get(":id")
    public at(
        @core.TypedParam("id") id: number,
    ): ArrayRecursiveUnionExplicit.IBucket {
        id;
        return typia.random<ArrayRecursiveUnionExplicit.IBucket>();
    }

    @core.TypedRoute.Post()
    public store(
        @core.TypedBody() body: ArrayRecursiveUnionExplicit.IBucket,
    ): ArrayRecursiveUnionExplicit.IBucket {
        return body;
    }
}

export type ArrayRecursiveUnionExplicit = ArrayRecursiveUnionExplicit.IBucket[];
export namespace ArrayRecursiveUnionExplicit {
    export type IBucket =
        | IDirectory
        | IImageFile
        | ITextFile
        | IZipFile
        | IShortcut;
    export type IFile = IImageFile | ITextFile | IZipFile;

    export interface IDirectory {
        id: number;
        name: string;
        path: string;
        children: IBucket[];
        type: "directory";
    }

    export interface IImageFile {
        id: number;
        name: string;
        path: string;
        width: number;
        height: number;
        url: string;
        size: number;
        type: "file";
        extension: "jpg";
    }
    export interface ITextFile {
        id: number;
        name: string;
        path: string;
        size: number;
        content: string;
        type: "file";
        extension: "txt";
    }
    export interface IZipFile {
        id: number;
        name: string;
        path: string;
        size: number;
        count: number;
        type: "file";
        extension: "zip";
    }

    export interface IShortcut {
        id: number;
        name: string;
        path: string;
        target: IBucket;
        type: "file";
        extension: "lnk";
    }
}
