/**
 * FormData input type.
 *
 * `FormDataInput<T>` is a type for the input of the `FormData` request, casting
 * `File` property value type as an union of `File` and {@link FormDataInput.IFileProps},
 * especially for the React Native environment.
 *
 * You know what? In the React Native environment, `File` class is not supported.
 * Therefore, when composing a `FormData` request, you have to put the URI address
 * of the local filesystem with file name and contet type that is represented by the
 * {@link FormDataInput.IFileProps} type.
 *
 * This `FormDataInput<T>` type is designed for that purpose. If the property value
 * type is a `File` class, it converts it to an union type of `File` and
 * {@link FormDataInput.IFileProps} type. Also, if the property value type is an array
 * of `File` class, it converts it to an array of union type of `File` and
 * {@link FormDataInput.IFileProps} type too.
 *
 * Before    | After
 * ----------|------------------------
 * `boolean` | `boolean`
 * `bigint`  | `bigint`
 * `number`  | `number`
 * `string`  | `string`
 * `File`    | `File \| IFileProps`
 * `Object`  | `never`
 *
 * @template T Target object type.
 * @author Jeongho Nam - https://github.com/samchon
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
   * If the original value type is a `File` class, `Value<T>` converts it to an union
   * type of `File` and {@link IFileProps} type which is a structured data for the
   * URI file location in the React Native environment.
   */
  export type Value<T> = T extends File ? T | IFileProps : T;

  /**
   * Properties of a file.
   *
   * In the React Native, this `IFileProps` structured data can replace the `File`
   * class instance in the `FormData` request.
   *
   * Just put the {@link uri URI address} of the local file system with the file's
   * {@link name} and {@link type}. It would be casted to the `File` class instance
   * automatically in the `FormData` request.
   *
   * Note that, this `IFileProps` type works only in the React Native environment.
   * If you are developing a Web or NodeJS application, you have to utilize the
   * `File` class instance directly.
   */
  export interface IFileProps {
    /**
     * URI address of the file.
     *
     * In the React Native, the URI address in the local file system can replace
     * the `File` class instance. If
     *
     * @format uri
     */
    uri: string;

    /**
     * Name of the file.
     */
    name: string;

    /**
     * Content type of the file.
     */
    type: string;
  }
}
