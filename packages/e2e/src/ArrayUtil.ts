/**
 * Utility functions for arrays.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace ArrayUtil {
    export const asyncFilter =
        <Input>(elements: readonly Input[]) =>
        async (
            pred: (
                elem: Input,
                index: number,
                array: readonly Input[],
            ) => Promise<boolean>,
        ): Promise<Input[]> => {
            const ret: Input[] = [];
            await asyncForEach(elements)(async (elem, index, array) => {
                const flag: boolean = await pred(elem, index, array);
                if (flag === true) ret.push(elem);
            });
            return ret;
        };

    export const asyncForEach =
        <Input>(elements: readonly Input[]) =>
        async (
            closure: (
                elem: Input,
                index: number,
                array: readonly Input[],
            ) => Promise<any>,
        ): Promise<void> => {
            await asyncRepeat(elements.length)((index) =>
                closure(elements[index], index, elements),
            );
        };

    export const asyncMap =
        <Input>(elements: readonly Input[]) =>
        async <Output>(
            closure: (
                elem: Input,
                index: number,
                array: readonly Input[],
            ) => Promise<Output>,
        ): Promise<Output[]> => {
            const ret: Output[] = [];
            await asyncForEach(elements)(async (elem, index, array) => {
                const output: Output = await closure(elem, index, array);
                ret.push(output);
            });
            return ret;
        };

    export const asyncRepeat =
        (count: number) =>
        async <T>(closure: (index: number) => Promise<T>): Promise<T[]> => {
            const indexes: number[] = new Array(count)
                .fill(1)
                .map((_, index) => index);

            const output: T[] = [];
            for (const index of indexes) output.push(await closure(index));

            return output;
        };

    export const has =
        <T>(elements: readonly T[]) =>
        (pred: (elem: T) => boolean): boolean =>
            elements.find(pred) !== undefined;

    export const repeat =
        (count: number) =>
        <T>(closure: (index: number) => T): T[] =>
            new Array(count).fill("").map((_, index) => closure(index));

    export const flat = <T>(matrix: T[][]): T[] =>
        ([] as T[]).concat(...matrix);

    export const subsets = <T>(array: T[]): T[][] => {
        const check: boolean[] = new Array(array.length).fill(false);
        const output: T[][] = [];

        const dfs = (depth: number): void => {
            if (depth === check.length)
                output.push(array.filter((_v, idx) => check[idx]));
            else {
                check[depth] = true;
                dfs(depth + 1);

                check[depth] = false;
                dfs(depth + 1);
            }
        };
        dfs(0);
        return output;
    };
}
