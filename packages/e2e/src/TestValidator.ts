import { is_sorted } from "tstl/ranges";

/**
 * Test validator.
 *
 * `TestValidator` is a collection gathering E2E validation functions.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace TestValidator {
    /**
     * Test whether error occurs.
     *
     * If error occurs, nothing would be happened.
     *
     * However, no error exists, then exception would be thrown.
     *
     * @param title Title of exception because of no error exists
     */
    export const error =
        (title: string) =>
        async (task: () => any | Promise<any>): Promise<void> => {
            try {
                await task();
            } catch {
                return;
            }
            throw new Error(`Bug on ${title}: exception must be thrown.`);
        };

    /**
     * Validate index API.
     *
     * Test whether two indexed values are equal.
     *
     * If two values are different, then exception would be thrown.
     *
     * @param title Title of error message when different
     * @return Currying function
     *
     * @example https://github.com/samchon/nestia-template/blob/master/src/test/features/api/bbs/test_api_bbs_article_index_search.ts
     */
    export const index =
        (title: string) =>
        <Solution extends IEntity<any>>(expected: Solution[]) =>
        <Summary extends IEntity<any>>(
            gotten: Summary[],
            trace: boolean = true,
        ): void => {
            const length: number = Math.min(expected.length, gotten.length);
            expected = expected.slice(0, length);
            gotten = gotten.slice(0, length);

            const xIds: string[] = get_ids(expected).slice(0, length);
            const yIds: string[] = get_ids(gotten)
                .filter((id) => id >= xIds[0])
                .slice(0, length);

            const equals: boolean = xIds.every((x, i) => x === yIds[i]);
            if (equals === true) return;
            else if (trace === true)
                console.log({
                    expected: xIds,
                    gotten: yIds,
                });
            throw new Error(
                `Bug on ${title}: result of the index is different with manual aggregation.`,
            );
        };

    /**
     * Validate sorting options.
     *
     * Test a pagination API supporting sorting options.
     *
     * You can validate detailed sorting options both asceding and descending orders
     * with multiple fields. However, as it forms a complicate currying function,
     * I recomend you to see below example code before using.
     *
     * @param title Title of error messaeg when sorting is invalid
     *
     * @example https://github.com/samchon/nestia-template/blob/master/src/test/features/api/bbs/test_api_bbs_article_index_sort.ts
     */
    export const sort =
        (title: string) =>
        /**
         * @param getter A pagination API function to be called
         */
        <
            T extends object,
            Fields extends string,
            Sortable extends Array<`-${Fields}` | `+${Fields}`>,
        >(
            getter: (sortable: Sortable) => Promise<T[]>,
        ) =>
        /**
         * @param fields List of fields to be sorted
         */
        (...fields: Fields[]) =>
        /**
         * @param comp Comparator function for validation
         * @param filter Filter function for data if required
         */
        (comp: (x: T, y: T) => number, filter?: (elem: T) => boolean) =>
        /**
         * @param direction "+" means ascending order, and "-" means descending order
         */
        async (direction: "+" | "-", trace: boolean = true) => {
            let data: T[] = await getter(
                fields.map(
                    (field) => `${direction}${field}` as const,
                ) as Sortable,
            );
            if (filter) data = data.filter(filter);

            const reversed: typeof comp =
                direction === "+" ? comp : (x, y) => comp(y, x);
            if (is_sorted(data, (x, y) => reversed(x, y) < 0) === false) {
                if (
                    fields.length === 1 &&
                    data.length &&
                    (data as any)[0][fields[0]] !== undefined &&
                    trace
                )
                    console.log(data.map((elem) => (elem as any)[fields[0]]));
                throw new Error(
                    `Bug on ${title}: wrong sorting on ${direction}(${fields.join(
                        ", ",
                    )}).`,
                );
            }
        };

    export type Sortable<Literal extends string> = Array<
        `-${Literal}` | `+${Literal}`
    >;
}

interface IEntity<Type extends string | number | bigint> {
    id: Type;
}

function get_ids<Entity extends IEntity<any>>(entities: Entity[]): string[] {
    return entities.map((entity) => entity.id).sort((x, y) => (x < y ? -1 : 1));
}
