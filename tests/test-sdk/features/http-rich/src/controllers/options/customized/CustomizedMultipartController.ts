import core from "@nestia/core";
import { ArrayUtil } from "@nestia/e2e";
import { Controller } from "@nestjs/common";
import fs from "fs";
import Multer from "multer";
import path from "path";

import { CustomizedIMultipart } from "../../../structures/customized/multipart/CustomizedIMultipart";
import { validateMultipartBlob } from "./validateMultipartBlob";

const UPLOAD_DIRECTORY: string = path.resolve(
  __dirname,
  "../../../uploads/customized-multipart",
);
fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });

@Controller("http_rich/options/customized/multipart")
export class CustomizedMultipartController {
  @core.TypedRoute.Post()
  public async post(
    @core.TypedFormData.Body(() => Multer()) body: CustomizedIMultipart,
  ): Promise<CustomizedIMultipart.IContent> {
    await validateMultipartBlob(0)(body.blob);
    await ArrayUtil.asyncForEach(body.blobs, (blob, i) =>
      validateMultipartBlob(i)(blob),
    );
    await validateMultipartBlob(1, "first.png")(body.file);
    await ArrayUtil.asyncForEach(body.files, (file, i) =>
      validateMultipartBlob(i, `${i}.png`)(file),
    );
    return body;
  }

  /**
   * Multer disk storage keeps an upload in a file instead of a buffer; the
   * handler must still receive its bytes.
   */
  @core.TypedRoute.Post("disk")
  public async disk(
    @core.TypedFormData.Body(() =>
      Multer({
        storage: Multer.diskStorage({ destination: UPLOAD_DIRECTORY }),
      }),
    )
    body: CustomizedIMultipart.IDisk,
  ): Promise<CustomizedIMultipart.IDiskContent> {
    return {
      name: body.file.name,
      size: body.file.size,
      text: await body.file.text(),
    };
  }
}
