import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { createMultipartUpload } from "../../../../internal/MultipartFactory";
import { IBbsArticle } from "../structures/IBbsArticle";
import { IOptionalForm, IUploadForm } from "../structures/IUploadForm";

/**
 * Routes whose request bodies or responses carry what Swagger 2.0 has no place
 * for: an encryption flag, a success body whose media type its exceptions do
 * not share, a form body's description and object attributes, form fields
 * taking several files or null, a form body required while its fields are
 * optional, and named exception examples.
 *
 * The original declarations are reused by the rich native producer. Its two
 * runtime adapters share the existing public multipart middleware factory;
 * Swagger 2.0 configured generation remains a separate pending connection.
 *
 * @evidence contracts/common.md#principled-implementation Original encrypted, exception and File/Blob form declarations retain their wire meanings; the existing multipart composition supplies the supported middleware for each actual adapter without changing those declared types.
 * @evidence contracts/common.md#clear-and-simple-design Stateless original routes stay together and reuse one established multipart factory; no new adapter or application lifetime is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supported factory delegates to actual Express and Fastify middleware without replacing foreign methods or fabricating schema output.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes the copied native specimens, the shared runtime adapter connection and the pending configured 2.0 generator boundary.
 */
@Controller("swagger_only/examples/downgrade")
export class DowngradeController {
  @core.TypedException<IBbsArticle.ICreate>({
    status: 404,
    description: "not found",
  })
  @core.EncryptedRoute.Post("encrypted")
  /**
   * Echoes the original encrypted body and declares its typed not-found body.
   *
   * @evidence contracts/common.md#principled-implementation The original ICreate input, output and typed exception remain unchanged and the encrypted decorator owns the public wire transformation.
   * @evidence contracts/common.md#clear-and-simple-design This stateless route returns its decoded input without introducing another serializer or retained state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No encryption, validation or declared exception metadata is bypassed or substituted.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes the encrypted echo from its declared not-found response specimen.
   */
  public encrypted(
    @core.EncryptedBody() input: IBbsArticle.ICreate,
  ): IBbsArticle.ICreate {
    return input;
  }

  @core.TypedRoute.Post("form")
  /**
   * Upload a form.
   *
   * @param input Form to upload
   * @evidence contracts/common.md#principled-implementation TypedFormData retains the original IUploadForm fields and the shared factory supplies their actual public multipart middleware; the original void handler consumes the decoded argument without introducing an output oracle.
   * @evidence contracts/common.md#clear-and-simple-design The route only binds its original form and discards it; middleware composition remains with the existing helper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No declared field, nullable or array value is narrowed to make generated requests pass.
   * @evidence contracts/common.md#meaningful-documentation The original upload purpose and parameter description remain useful native input to the Swagger assertions.
   */
  public form(
    @core.TypedFormData.Body(() => createMultipartUpload()) input: IUploadForm,
  ): void {
    input;
  }

  @core.TypedRoute.Post("optional-form")
  /**
   * Returns the original form whose only field is optional.
   *
   * @evidence contracts/common.md#principled-implementation The original optional memo declaration and echo preserve empty and supplied forms while the supported multipart factory owns decoding.
   * @evidence contracts/common.md#clear-and-simple-design This route returns its decoded form unchanged without retained state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No generated input is detected or substituted and no validator is bypassed.
   * @evidence contracts/common.md#meaningful-documentation The comment states the empty-form boundary represented by the original declaration.
   */
  public optionalForm(
    @core.TypedFormData.Body(() => createMultipartUpload())
    input: IOptionalForm,
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
  /**
   * Declares the original named not-found example beside a void success body.
   *
   * @evidence contracts/common.md#principled-implementation The original typed exception status, description and named ICreate example remain native producer inputs while successful execution returns no body.
   * @evidence contracts/common.md#clear-and-simple-design The empty handler and decorator declaration expose the two response shapes without a second implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The example still comes from the original typia random declaration and no generated document is rewritten.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the named exception example and contrasts it with the successful void response.
   */
  public exception(): void {}
}
