export const json_equal_to =
  (exception: (key: string) => boolean) =>
  <T>(x: T) =>
  (y: T | null | undefined): string[] => {
    const container: string[] = [];
    const iterate =
      (accessor: string) =>
      (x: any) =>
      (y: any): void => {
        if (typeof x === "function" || typeof y === "function") return;
        else if (typeof x !== typeof y) container.push(accessor);
        // `typeof null` is "object", so the check above does not separate an
        // object from null. Settle every null pair here, before the Array and
        // Object branches walk into one: `null` is a JSON value, and comparing
        // it against an object is a difference at this accessor, exactly as it
        // already was when the two operands were swapped.
        else if (x === null || y === null) {
          if (x !== y) container.push(accessor);
        } else if (x instanceof Array)
          if (!(y instanceof Array)) container.push(accessor);
          else array(accessor)(x)(y);
        else if (x instanceof Object)
          if (!(y instanceof Object) || y instanceof Array)
            container.push(accessor);
          else object(accessor)(x)(y);
        else if (x !== y) container.push(accessor);
      };
    const array =
      (accessor: string) =>
      (x: any[]) =>
      (y: any[]): void => {
        if (x.length !== y.length) container.push(`${accessor}.length`);
        x.forEach((xItem, i) => iterate(`${accessor}[${i}]`)(xItem)(y[i]));
      };
    const object =
      (accessor: string) =>
      (x: any) =>
      (y: any): void => {
        const keys = (input: any): string[] =>
          Object.keys(input).filter(
            (key) => input[key] !== undefined && !exception(key),
          );
        const xKeys: string[] = keys(x);
        const yKeys: string[] = keys(y);
        if (
          xKeys.length !== yKeys.length ||
          xKeys.some((key) => yKeys.includes(key) === false)
        )
          container.push(accessor);
        for (const key of xKeys)
          if (yKeys.includes(key))
            iterate(`${accessor}.${key}`)(x[key])(y[key]);
      };

    iterate("")(x)(y);
    return container;
  };
