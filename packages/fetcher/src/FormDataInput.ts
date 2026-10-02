/**
 * FormData input type.
 *
 * `FormDataInput<T>` is a type for the input of the `FormData` request, casting
 * `File` property value type as an union of `File` and
 * {@link FormDataInput.IFileProps}, especially for the React Native
 * environment.
 *
 * You know what? In the React Native environment, `File` class is not
 * supported. Therefore, when composing a `FormData` request, you have to put
 * the URI address of the local filesystem with file name and content type that
 * is represented by the {@link FormDataInput.IFileProps} type.
 *
 * This `FormDataInput<T>` type is designed for that purpose. If the property
 * value type is a `File` class, it converts it to an union type of `File` and
 * {@link FormDataInput.IFileProps} type. Also, if the property value type is an
 * array of `File` class, it converts it to an array of union type of `File` and
 * {@link FormDataInput.IFileProps} type too.
 *
 * Atomic fields retain their original types; file fields accept either a File
 * or the React Native file descriptor.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @template T Target object type.
 * @evidence contracts/common.md#principled-implementation The mapped type delegates each field to a distributive value conversion, so file alternatives and file-array alternatives accept React Native descriptors even when optional or mixed with another field type. Arrays and functions at the outer body level become never because a form body is an object of named fields.
 * @evidence contracts/common.md#clear-and-simple-design One conditional over the object type, delegating the per-value rule to `FormDataInput.Value`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the React Native motive, which fields are converted, and the platform limit of descriptors.
 */
export type FormDataInput<T extends object> =
  T extends Array<any>
    ? never
    : T extends Function
      ? never
      : {
          [P in keyof T]: FormDataInput.Value<T[P]>;
        };
export namespace FormDataInput {
  /**
   * Value type of the `FormDataInput`.
   *
   * `Value<T>` is a type for the property value defined in the `FormDataInput`.
   *
   * If the original value type is a `File` class, `Value<T>` converts it to an
   * union type of `File` and {@link IFileProps} type which is a structured data
   * for the URI file location in the React Native environment.
   *
   * @evidence contracts/common.md#principled-implementation Distribution examines each optional or union alternative separately; mutable arrays convert their immediate File elements, File becomes File or its descriptor, and other scalar alternatives retain their types.
   * @evidence contracts/common.md#clear-and-simple-design One value conversion owns scalar and array handling, so the outer mapped type applies one rule to every field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states the conversion for `File` values.
   */
  export type Value<T> =
    T extends Array<infer U>
      ? (U extends File ? U | IFileProps : U)[]
      : T extends File
        ? T | IFileProps
        : T;

  /**
   * Properties of a file.
   *
   * In the React Native, this `IFileProps` structured data can replace the
   * `File` class instance in the `FormData` request.
   *
   * Just put the {@link uri URI address} of the local file system with the
   * file's {@link name} and {@link type}. React Native's FormData implementation
   * consumes this descriptor; the fetcher does not construct a File instance.
   *
   * Note that, this `IFileProps` type works only in the React Native
   * environment. If you are developing a Web or NodeJS application, you have to
   * utilize the `File` class instance directly.
   *
   * @evidence contracts/common.md#principled-implementation React Native has no `File` class, so a file is described by the local URI, the file name, and the content type, which is the shape its FormData implementation accepts.
   * @evidence contracts/common.md#clear-and-simple-design A three-field record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states the platform limit and each field is documented.
   */
  export interface IFileProps {
    /**
     * URI address of the file.
     *
     * In the React Native, the URI address in the local file system can replace
     * the `File` class instance.
     *
     * @format uri
     */
    uri: string;

    /** Name of the file. */
    name: string;

    /** Content type of the file. */
    type: string;
  }
}
