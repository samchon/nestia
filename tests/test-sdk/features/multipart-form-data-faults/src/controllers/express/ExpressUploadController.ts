import core from "@nestia/core";
import { BadRequestException, Controller } from "@nestjs/common";
import Multer from "multer";

import { IUpload } from "@api/lib/structures/IUpload";

import { UPLOAD_DISK } from "../../UploadDisk";

@Controller("express")
export class ExpressUploadController {
  @core.TypedRoute.Post("memory")
  public async memory(
    @core.TypedFormData.Body(() =>
      Multer({ storage: Multer.memoryStorage(), limits: { fileSize: 10 } }),
    )
    body: IUpload,
  ): Promise<number> {
    return body.file.size;
  }

  @core.TypedRoute.Post("disk")
  public async disk(
    @core.TypedFormData.Body(() => Multer({ dest: UPLOAD_DISK.express }))
    body: IUpload,
  ): Promise<string> {
    return body.file.text();
  }

  @core.TypedRoute.Post("filter")
  public async filter(
    @core.TypedFormData.Body(() =>
      Multer({
        fileFilter: (_request, _file, callback) =>
          callback(new BadRequestException("filtered")),
      }),
    )
    body: IUpload,
  ): Promise<number> {
    return body.file.size;
  }
}
