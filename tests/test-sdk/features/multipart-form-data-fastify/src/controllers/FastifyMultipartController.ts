import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import FastifyMulter from "fastify-multer";

import { IFastifyMultipart } from "../api/structures/IFastifyMultipart";

@Controller("multipart")
export class FastifyMultipartController {
  @core.TypedRoute.Post()
  public async post(
    @core.TypedFormData.Body(() => FastifyMulter())
    body: IFastifyMultipart,
  ): Promise<IFastifyMultipart.IContent> {
    const read = async (file: File): Promise<IFastifyMultipart.IFile> => ({
      name: file.name,
      text: await file.text(),
    });
    return {
      title: body.title,
      file: await read(body.file),
      files: await Promise.all(body.files.map(read)),
    };
  }
}
