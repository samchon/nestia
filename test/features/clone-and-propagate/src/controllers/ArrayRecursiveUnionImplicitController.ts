import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("arrayRecursiveUnionImplicit")
export class ArrayRecursiveUnionImplicitController {
    @core.TypedRoute.Get()
    public index(): ArrayRecursiveUnionImplicit {
        return typia.random<ArrayRecursiveUnionImplicit>();
    }

    @core.TypedRoute.Get(":id")
    public at(
        @core.TypedParam("id") id: number,
    ): ArrayRecursiveUnionImplicit.IBucket {
        id;
        return typia.random<ArrayRecursiveUnionImplicit.IBucket>();
    }

    @core.TypedRoute.Post()
    public store(
        @core.TypedBody() body: ArrayRecursiveUnionImplicit.IBucket,
    ): ArrayRecursiveUnionImplicit.IBucket {
        return body;
    }
}

export type ArrayRecursiveUnionImplicit = ArrayRecursiveUnionImplicit.IBucket[];
export namespace ArrayRecursiveUnionImplicit {
    export type IBucket =
        | IDirectory
        | ISharedDirectory
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
    }

    export interface ISharedDirectory extends IDirectory {
        access: "read" | "write";
    }

    export interface IImageFile {
        id: number;
        name: string;
        path: string;
        width: number;
        height: number;
        url: string;
        size: number;
    }
    export interface ITextFile {
        id: number;
        name: string;
        path: string;
        size: number;
        content: string;
    }
    export interface IZipFile {
        id: number;
        name: string;
        path: string;
        size: number;
        count: number;
    }

    export interface IShortcut {
        id: number;
        name: string;
        path: string;
        target: IBucket;
    }
}
