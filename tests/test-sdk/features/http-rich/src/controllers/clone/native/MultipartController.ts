import { TypedFormData, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import Multer from "multer";
import { tags } from "typia";

@Controller("http_rich/clone/native/multipart")
export class CloneNativeMultipartController {
  @TypedRoute.Post()
  public post(
    @TypedFormData.Body(() => Multer()) body: CloneNativeIMultipart,
  ): void {
    body;
  }
}

interface CloneNativeIMultipart {
  id: string & tags.Format<"uuid">;
  strings: string[];
  number: number;
  integers: Array<number & tags.Type<"int32">>;
  blob: Blob;
  blobs: Blob[];
  file: File;
  files: File[];
}
