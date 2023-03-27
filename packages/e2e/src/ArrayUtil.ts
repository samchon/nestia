/**
 * Utility functions for arrays.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace ArrayUtil {
    export async function asyncFilter<Input>(
        elements: readonly Input[],
        pred: (
            elem: Input,
            index: number,
            array: readonly Input[],
        ) => Promise<boolean>,
    ): Promise<Input[]> {
        const ret: Input[] = [];
        await asyncForEach(elements, async (elem, index, array) => {
            const flag: boolean = await pred(elem, index, array);
            if (flag === true) ret.push(elem);
        });
        return ret;
    }

    export async function asyncForEach<Input>(
        elements: readonly Input[],
        closure: (
            elem: Input,
            index: number,
            array: readonly Input[],
        ) => Promise<any>,
    ): Promise<void> {
        await asyncRepeat(elements.length, (index) =>
            closure(elements[index], index, elements),
        );
    }

    export async function asyncMap<Input, Output>(
        elements: readonly Input[],
        closure: (
            elem: Input,
            index: number,
            array: readonly Input[],
        ) => Promise<Output>,
    ): Promise<Output[]> {
        const ret: Output[] = [];
        await asyncForEach(elements, async (elem, index, array) => {
            const output: Output = await closure(elem, index, array);
            ret.push(output);
        });
        return ret;
    }

    export async function asyncRepeat<T>(
        count: number,
        closure: (index: number) => Promise<T>,
    ): Promise<T[]> {
        const indexes: number[] = new Array(count)
            .fill(1)
            .map((_, index) => index);

        const output: T[] = [];
        for (const index of indexes) output.push(await closure(index));

        return output;
    }

    export function has<T>(
        elements: readonly T[],
        pred: (elem: T) => boolean,
    ): boolean {
        return elements.find(pred) !== undefined;
    }

    export function repeat<T>(
        count: number,
        closure: (index: number) => T,
    ): T[] {
        return new Array(count).fill("").map((_, index) => closure(index));
    }

    export function last<T>(array: T[]): T {
        return array[array.length - 1];
    }

    export function flat<T>(matrix: T[][]): T[] {
        return ([] as T[]).concat(...matrix);
    }

    export function subsets<T>(array: T[]): T[][] {
        const check: boolean[] = new Array(array.length).fill(false);
        const output: T[][] = [];
    
        const dfs = (depth: number) => {
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
    }
}
