export namespace ArrayUtil {
  export function has<T>(array: T[], ...items: T[]): boolean {
    return items.every(
      (elem) => array.find((org) => org === elem) !== undefined,
    );
  }

  export async function asyncMap<Input, Output>(
    array: Input[],
    closure: (input: Input) => Promise<Output>,
  ): Promise<Output[]> {
    const ret: Output[] = [];
    for (const elem of array) ret.push(await closure(elem));
    return ret;
  }

  export async function asyncFilter<Input>(
    array: Input[],
    closure: (input: Input) => Promise<boolean>,
  ): Promise<Input[]> {
    const ret: Input[] = [];
    for (const elem of array)
      if ((await closure(elem)) === true) ret.push(elem);
    return ret;
  }
}
