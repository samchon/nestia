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
  public at(@core.TypedParam("id") id: number): IBucket {
    id;
    return typia.random<IBucket>();
  }

  @core.TypedRoute.Post()
  public store(@core.TypedBody() body: IBucket): IBucket {
    return body;
  }
}

type ArrayRecursiveUnionExplicit = IBucket[];
type IBucket = IDirectory | IImageFile | ITextFile | IZipFile | IShortcut;
interface IDirectory {
  id: number;
  name: string;
  path: string;
  children: IBucket[];
  type: "directory";
}

interface IImageFile {
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
interface ITextFile {
  id: number;
  name: string;
  path: string;
  size: number;
  content: string;
  type: "file";
  extension: "txt";
}
interface IZipFile {
  id: number;
  name: string;
  path: string;
  size: number;
  count: number;
  type: "file";
  extension: "zip";
}
interface IShortcut {
  id: number;
  name: string;
  path: string;
  target: IBucket;
  type: "file";
  extension: "lnk";
}
