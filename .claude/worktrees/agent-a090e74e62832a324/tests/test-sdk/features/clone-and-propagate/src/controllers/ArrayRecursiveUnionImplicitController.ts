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
  public at(@core.TypedParam("id") id: number): IBucket {
    id;
    return typia.random<IBucket>();
  }

  @core.TypedRoute.Post()
  public store(@core.TypedBody() body: IBucket): IBucket {
    return body;
  }
}

type ArrayRecursiveUnionImplicit = IBucket[];
type IBucket =
  | IDirectory
  | ISharedDirectory
  | IImageFile
  | ITextFile
  | IZipFile
  | IShortcut;
interface IDirectory {
  id: number;
  name: string;
  path: string;
  children: IBucket[];
}
interface ISharedDirectory extends IDirectory {
  access: "read" | "write";
}
interface IImageFile {
  id: number;
  name: string;
  path: string;
  width: number;
  height: number;
  url: string;
  size: number;
}
interface ITextFile {
  id: number;
  name: string;
  path: string;
  size: number;
  content: string;
}
interface IZipFile {
  id: number;
  name: string;
  path: string;
  size: number;
  count: number;
}
interface IShortcut {
  id: number;
  name: string;
  path: string;
  target: IBucket;
}
