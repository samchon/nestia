/**
 * @internal
 */
export class Singleton<T> {
    private value_: T | object;

    public constructor(private readonly closure_: () => T) {
        this.value_ = NOT_MOUNTED_YET;
    }

    public get(): T {
        if (this.value_ === NOT_MOUNTED_YET) this.value_ = this.closure_();
        return this.value_ as T;
    }
}

/**
 * @internal
 */
const NOT_MOUNTED_YET = {};
