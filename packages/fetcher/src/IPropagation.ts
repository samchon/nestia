/**
 * Propagation type.
 *
 * @template StatusMap Map of status code and its body data type.
 * @template Success Default success status code.
 * @author Jeongho Nam - https://github.com/samchon
 */
export type IPropagation<
    StatusMap extends {
        [P in IPropagation.Status]?: any;
    },
    Success extends number = 200 | 201,
> =
    | {
          [P in keyof StatusMap]: IPropagation.IBranch<
              P extends Success ? true : false,
              P,
              StatusMap[P]
          >;
      }[keyof StatusMap]
    | IPropagation.IBranch<false, number, any>;
export namespace IPropagation {
    /**
     * Type of configurable status codes.
     *
     * The special characters like `2XX`, `3XX`, `4XX`, `5XX` are meaning the range
     * of status codes. If `5XX` is specified, it means the status code is in the
     * range of `500` to `599`.
     */
    export type Status = number | "2XX" | "3XX" | "4XX" | "5XX";

    /**
     * Branch type of propagation.
     *
     * `IPropagation.IBranch` is a branch type composing `IPropagation` type,
     * which is gathering all possible status codes and their body data types
     * as a union type.
     */
    export interface IBranch<Success extends boolean, StatusValue, BodyData> {
        success: Success;
        status: StatusValue extends "2XX" | "3XX" | "4XX" | "5XX"
            ? StatusRange<StatusValue>
            : StatusValue extends number
            ? StatusValue
            : never;
        data: BodyData;
        headers: Record<string, string | string[]>;
    }

    /**
     * Range of status codes by the first digit.
     */
    export type StatusRange<T extends "2XX" | "3XX" | "4XX" | "5XX"> =
        T extends 0
            ? IntRange<200, 299>
            : T extends 3
            ? IntRange<300, 399>
            : T extends 4
            ? IntRange<400, 499>
            : IntRange<500, 599>;

    type IntRange<F extends number, T extends number> = Exclude<
        Enumerate<T>,
        Enumerate<F>
    >;

    type Enumerate<
        N extends number,
        Acc extends number[] = [],
    > = Acc["length"] extends N
        ? Acc[number]
        : Enumerate<N, [...Acc, Acc["length"]]>;
}
