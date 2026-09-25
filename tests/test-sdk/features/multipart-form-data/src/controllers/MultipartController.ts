import core from "@nestia/core";
import { ArrayUtil, TestValidator } from "@nestia/e2e";
import { Controller } from "@nestjs/common";
import Multer from "multer";
import os from "os";

import { IMultipart } from "@api/lib/structures/IMultipart";

@Controller("multipart")
export class MultipartController {
  @core.TypedRoute.Post()
  public async post(
    @core.TypedFormData.Body(() => Multer()) body: IMultipart,
  ): Promise<IMultipart.IContent> {
    await validateBlob(0)(body.blob);
    await ArrayUtil.asyncForEach(body.blobs, (blob, i) =>
      validateBlob(i)(blob),
    );
    await validateBlob(1, "first.png")(body.file);
    await ArrayUtil.asyncForEach(body.files, (file, i) =>
      validateBlob(i, `${i}.png`)(file),
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
      Multer({ storage: Multer.diskStorage({ destination: os.tmpdir() }) }),
    )
    body: IMultipart.IDisk,
  ): Promise<IMultipart.IDiskContent> {
    return {
      name: body.file.name,
      size: body.file.size,
      text: await body.file.text(),
    };
  }
}

const validateBlob =
  (value: number, name?: string) =>
  async (blob: Blob): Promise<void> => {
    const ab: ArrayBuffer = await blob.arrayBuffer();
    const buffer: Buffer = Buffer.from(ab);

    TestValidator.equals("buffer.length", buffer.length, 999);
    TestValidator.predicate("values", () =>
      buffer.every((byte) => byte === value),
    );
    if (blob instanceof File && name !== undefined)
      TestValidator.equals("file.name", name, blob.name);
  };
