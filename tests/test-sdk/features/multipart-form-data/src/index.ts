import typia from "typia";

typia.reflect.schemas<[IMultipart]>();
typia.json.schemas<[IMultipart]>();
typia.http.createFormData<IMultipart>();
interface IMultipart {
  blob: Blob;
  file: File;
}
