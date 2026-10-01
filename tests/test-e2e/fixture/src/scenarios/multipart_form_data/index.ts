import typia from "typia";

typia.reflect.schemas<[IMultipartMultipartFormData]>();
typia.json.schemas<[IMultipartMultipartFormData]>();
typia.http.createFormData<IMultipartMultipartFormData>();
interface IMultipartMultipartFormData {
  blob: Blob;
  file: File;
}
