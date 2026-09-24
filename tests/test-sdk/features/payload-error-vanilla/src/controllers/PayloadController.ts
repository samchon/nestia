import core from "@nestia/core";
import {
  Controller,
  RawBody,
  RawBodyRequest,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";

/**
 * Routes taking their payload through NestJS decorators the SDK cannot
 * describe: the multer field names live in the interceptors, and a raw body has
 * no type.
 */
@Controller("payload")
export class PayloadController {
  @core.TypedRoute.Post("file")
  @UseInterceptors(FileInterceptor("file"))
  public file(@UploadedFile() file: Express.Multer.File): void {
    file;
  }

  @core.TypedRoute.Post("files")
  @UseInterceptors(FilesInterceptor("files"))
  public files(@UploadedFiles() files: Express.Multer.File[]): void {
    files;
  }

  @core.TypedRoute.Post("raw")
  public raw(@RawBody() body: RawBodyRequest<Buffer>["rawBody"]): void {
    body;
  }
}
