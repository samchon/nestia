import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { createMultipartUpload } from "../../../internal/MultipartFactory";
import { IUpload } from "../structures/IUpload";

@Controller("uploads")
export class UploadsController {
  /**
   * Upload multipart files.
   *
   * @summary Upload files
   * @tag Uploads
   * @security bearer uploads:write
   */
  @core.TypedRoute.Post()
  public upload(
    @core.TypedFormData.Body(() => createMultipartUpload())
    input: IUpload.IForm,
  ): IUpload.IResult {
    return {
      title: input.title,
      description: input.description,
      count: 1 + (input.previews?.length ?? 0),
    };
  }

  /**
   * Store a raw text payload.
   *
   * @summary Store raw text
   * @tag Uploads
   */
  @core.TypedRoute.Post("raw")
  public raw(@core.PlainBody() content: string): IUpload.IRaw {
    return {
      content,
      length: content.length,
    };
  }
}
