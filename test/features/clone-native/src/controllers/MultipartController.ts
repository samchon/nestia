import { TypedMultipart, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("multipart")
export class MultipartController {
  @TypedRoute.Post()
  public post(@TypedMultipart.Body() body: IMultipart): void {
    body;
  }
}

interface IMultipart {
  id: string & tags.Format<"uuid">;
  strings: string[];
  number: number;
  integers: Array<number & tags.Type<"int32">>;
  blob: Blob;
  blobs: Blob[];
  file: File;
  files: File[];
}
