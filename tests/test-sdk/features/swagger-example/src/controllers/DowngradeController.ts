import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import Multer from "multer";
import typia from "typia";

import { IBbsArticle } from "@api/lib/structures/IBbsArticle";
import { IOptionalForm, IUploadForm } from "@api/lib/structures/IUploadForm";

/**
 * Routes whose request bodies or responses carry what Swagger 2.0 has no place
 * for: an encryption flag, a success body whose media type its exceptions do
 * not share, a form body's description and object attributes, form fields
 * taking several files or null, a form body required while its fields are
 * optional, and named exception examples.
 */
@Controller("downgrade")
export class DowngradeController {
  @core.TypedException<IBbsArticle.ICreate>({
    status: 404,
    description: "not found",
  })
  @core.EncryptedRoute.Post("encrypted")
  public encrypted(
    @core.EncryptedBody() input: IBbsArticle.ICreate,
  ): IBbsArticle.ICreate {
    return input;
  }

  /**
   * Upload a form.
   *
   * @param input Form to upload
   */
  @core.TypedRoute.Post("form")
  public form(
    @core.TypedFormData.Body(() => Multer()) input: IUploadForm,
  ): void {
    input;
  }

  @core.TypedRoute.Post("optional-form")
  public optionalForm(
    @core.TypedFormData.Body(() => Multer()) input: IOptionalForm,
  ): IOptionalForm {
    return input;
  }

  @core.TypedException<IBbsArticle.ICreate>({
    status: 404,
    description: "not found",
    examples: {
      missing: {
        summary: "missing",
        value: typia.random<IBbsArticle.ICreate>(),
      },
    },
  })
  @core.TypedRoute.Get("exception")
  public exception(): void {}
}
