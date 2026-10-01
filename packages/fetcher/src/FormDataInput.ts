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
 * Before | After ----------|------------------------ `boolean` | `boolean`
 * `bigint` | `bigint` `number` | `number` `string` | `string` `File` | `File \|
 * IFileProps`
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @template T Target object type.
 * @evidence contracts/common.md#principled-implementation The mapped type rewrites each property whose type is `File` into `File | IFileProps` and each array of files into an array of that union, and it maps arrays and functions to `never` because a form body is an object of named fields.
 * @evidence contracts/common.md#clear-and-simple-design One conditional over the object type, delegating the per-value rule to `FormDataInput.Value`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the React Native motive, the conversion table, and links the helper types.
 */
export type FormDataInput<T extends object> =
  T extends Array<any>
    ? never
    : T extends Function
      ? never
      : {
          [P in keyof T]: T[P] extends Array<infer U>
            ? FormDataInput.Value<U>[]
            : FormDataInput.Value<T[P]>;
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
   * @evidence contracts/common.md#principled-implementation A distributive conditional turns a `File` into the union of the file and its React Native descriptor and leaves every other type unchanged, so optional and union members keep their other alternatives.
   * @evidence contracts/common.md#clear-and-simple-design A one-line conditional, separate so the array branch of `FormDataInput` can reuse it for elements.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states the conversion for `File` values.
   */
  export type Value<T> = T extends File ? T | IFileProps : T;

  /**
   * Properties of a file.
   *
   * In the React Native, this `IFileProps` structured data can replace the
   * `File` class instance in the `FormData` request.
   *
   * Just put the {@link uri URI address} of the local file system with the
   * file's {@link name} and {@link type}. It would be casted to the `File` class
   * instance automatically in the `FormData` request.
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
