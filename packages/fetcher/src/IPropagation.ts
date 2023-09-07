import { Primitive } from "./Primitive";

export interface IPropagation<
    Status extends number,
    Data,
    Success extends boolean = Status extends 200 | 201 ? true : false,
> {
    status: Status;
    data: Primitive<Data>;
    success: Success;
    headers: Record<string, string | string[]>;
}
export namespace IPropagation {
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
