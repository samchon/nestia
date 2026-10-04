import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import Multer from "multer";
import typia from "typia";

import { SwaggerExampleIBbsArticle } from "../../../../structures/swagger_example/IBbsArticle";
import {
  SwaggerExampleIOptionalForm,
  SwaggerExampleIUploadForm,
} from "../../../../structures/swagger_example/IUploadForm";

/**
 * Routes whose request bodies or responses carry what Swagger 2.0 has no place
 * for: an encryption flag, a success body whose media type its exceptions do
 * not share, a form body's description and object attributes, form fields
 * taking several files or null, a form body required while its fields are
 * optional, and named exception examples.
 */
@Controller("http_rich/options/swagger_example/downgrade")
export class SwaggerExampleDowngradeController {
  @core.TypedException<SwaggerExampleIBbsArticle.ICreate>({
    status: 404,
    description: "not found",
  })
  @core.EncryptedRoute.Post("encrypted")
  public encrypted(
    @core.EncryptedBody() input: SwaggerExampleIBbsArticle.ICreate,
  ): SwaggerExampleIBbsArticle.ICreate {
    return input;
  }

  /**
   * Upload a form.
   *
   * @param input Form to upload
   */
  @core.TypedRoute.Post("form")
  public form(
    @core.TypedFormData.Body(() => Multer()) input: SwaggerExampleIUploadForm,
  ): void {
    input;
  }

  @core.TypedRoute.Post("optional-form")
  public optionalForm(
    @core.TypedFormData.Body(() => Multer()) input: SwaggerExampleIOptionalForm,
  ): SwaggerExampleIOptionalForm {
    return input;
  }

  @core.TypedException<SwaggerExampleIBbsArticle.ICreate>({
    status: 404,
    description: "not found",
    examples: {
      missing: {
        summary: "missing",
        value: typia.random<SwaggerExampleIBbsArticle.ICreate>(),
      },
    },
  })
  @core.TypedRoute.Get("exception")
  public exception(): void {}
}
