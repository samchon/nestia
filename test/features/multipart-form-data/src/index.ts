import typia from "typia";

typia.reflect.metadata<[IMultipart]>();
typia.json.application<[IMultipart]>();
typia.http.createFormData<IMultipart>();
interface IMultipart {
  blob: Blob;
  file: File;
}
