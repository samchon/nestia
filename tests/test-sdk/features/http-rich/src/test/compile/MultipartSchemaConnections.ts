import typia from "typia";

typia.reflect.schemas<[CustomizedMultipartSchemaInput]>();
typia.json.schemas<[CustomizedMultipartSchemaInput]>();
typia.http.createFormData<CustomizedMultipartSchemaInput>();
interface CustomizedMultipartSchemaInput {
  blob: Blob;
  file: File;
}
