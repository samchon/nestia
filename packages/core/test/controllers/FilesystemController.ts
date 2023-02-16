import core from "@nestia/core";
import * as nest from "@nestjs/common";

import { IFilesystemBucket } from "../api/structures/IFilesystemBucket";

@nest.Controller("filesystem")
export class FilesystemController {
    @core.TypedRoute.Get()
    public get(
        @core.TypedQuery() _input: IFilesystemBucket.IRequest,
    ): IFilesystemBucket[] {
        return [
            {
                type: "directory",
                id: "7b1068a4-dd6e-474a-8d85-09a2d77639cb",
                name: "ixcWGOKI",
                children: [
                    {
                        type: "directory",
                        id: "5883e17c-b207-46d4-ad2d-be72249711ce",
                        name: "vecQwFGS",
                        children: [],
                    },
                    {
                        type: "file",
                        id: "670b6556-a610-4a48-8a16-9c2da97a0d18",
                        name: "eStFddzX",
                        extension: "jpg",
                        size: 7,
                        width: 300,
                        height: 1200,
                        url: "https://github.com/samchon/typia",
                    },
                    {
                        type: "file",
                        id: "85dc796d-9593-4833-b1a1-addc8ebf74ea",
                        name: "kTdUfwRJ",
                        extension: "ts",
                        size: 86,
                        content: 'console.log("Hello world");',
                    },
                    {
                        type: "file",
                        id: "8933c86a-7a1e-4d4a-b0a6-17d6896fdf89",
                        name: "NBPkefUG",
                        extension: "zip",
                        size: 22,
                        count: 20,
                    },
                ],
            },
        ];
    }
}
