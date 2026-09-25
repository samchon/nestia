import core from "@nestia/core";
import { BadRequestException, Controller } from "@nestjs/common";
import FastifyMulter from "fastify-multer";

import { IUpload } from "@api/lib/structures/IUpload";

import { UPLOAD_DISK } from "../../UploadDisk";

@Controller("fastify")
export class FastifyUploadController {
  @core.TypedRoute.Post("memory")
  public async memory(
    @core.TypedFormData.Body(() =>
      FastifyMulter({
        storage: FastifyMulter.memoryStorage(),
        limits: { fileSize: 10 },
      }),
    )
    body: IUpload,
  ): Promise<number> {
    return body.file.size;
  }

  @core.TypedRoute.Post("disk")
  public async disk(
    @core.TypedFormData.Body(() => FastifyMulter({ dest: UPLOAD_DISK.fastify }))
    body: IUpload,
  ): Promise<string> {
    return body.file.text();
  }

  @core.TypedRoute.Post("filter")
  public async filter(
    @core.TypedFormData.Body(() =>
      FastifyMulter({
        fileFilter: (_request, _file, callback) =>
          callback(new BadRequestException("filtered")),
      }),
    )
    body: IUpload,
  ): Promise<number> {
    return body.file.size;
  }
}
