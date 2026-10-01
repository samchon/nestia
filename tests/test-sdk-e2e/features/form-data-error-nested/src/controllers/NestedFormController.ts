import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import Multer from "multer";

export interface INestedForm {
  nested: { value: string };
  file: File;
}

/**
 * A form-data body a multipart form cannot carry. The transform must name the
 * property and the rule, not only count the errors (#1717).
 */
@Controller("form")
export class NestedFormController {
  @core.TypedRoute.Post()
  public post(
    @core.TypedFormData.Body(() => Multer()) body: INestedForm,
  ): void {
    body;
  }
}
