/**
 * 객체의 원시 타입.
 * 
 * `Primitive` 는 대상 인스턴스의 모든 메서드를 제거하여, 그 타입을 pritimive object 의 형태로 
 * 바꾸어주는 TMP (Type Meta Programming) 타입이다.
 * 
 * @template Instance 대상 인스턴스
 * @author Samchon
 */
export type Primitive<Instance> = value_of<Instance> extends object
    ? Instance extends object
        ? Instance extends IJsonable<infer Raw>
            ? value_of<Raw> extends object
                ? Raw extends object
                    ? PrimitiveObject<Raw> // object would be primitified
                    : never // cannot be
                : value_of<Raw> // atomic value
            : PrimitiveObject<Instance> // object would be primitified
        : never // cannot be
    : value_of<Instance>;

export namespace Primitive
{
    /**
     * Primitive object 하드 카피.
     * 
     * `Primitive.clone()` 은 파라미터 인스턴스를 원시 오브젝트 형태로 hard copy 하는 함수이다.
     * 
     * @param instance 복사 대상 인스턴스
     * @return 복사된 객체
     */
    export function clone<Instance>(instance: Instance): Primitive<Instance>
    {
        return JSON.parse(JSON.stringify(instance));
    }

    /**
     * @todo
     */
    export function equal_to<Instance>(x: Instance, y: Instance): boolean
    {
        return JSON.stringify(x) === JSON.stringify(y) || recursive_equal_to(x, y);
    }
}

type PrimitiveObject<Instance extends object> = Instance extends Array<infer T>
    ? Primitive<T>[]
    : 
    {
        [P in keyof Instance]: Instance[P] extends Function
            ? never
            : Primitive<Instance[P]>
    };

type value_of<Instance> = 
    is_value_of<Instance, Boolean> extends true ? boolean
    : is_value_of<Instance, Number> extends true ? number
    : is_value_of<Instance, String> extends true ? string
    : Instance;

type is_value_of<Instance, Object extends IValueOf<any>> = 
    Instance extends Object
        ? Object extends IValueOf<infer Primitive>
            ? Instance extends Primitive
                ? false
                : true // not Primitive, but Object
            : false // cannot be
        : false;

interface IValueOf<T>
{
    valueOf(): T;
}

interface IJsonable<T>
{
    toJSON(): T;
}

function object_equal_to<T extends object>(x: T, y: T): boolean
{
    for (let key in x)
        if (recursive_equal_to(x[key], y[key]) === false)
            return false;
    return true;
}

function array_equal_to<T>(x: T[], y: T[]): boolean
{
    if (x.length !== y.length)
        return false;

    return x.every((value, index) => recursive_equal_to(value, y[index]));
}

function recursive_equal_to<T>(x: T, y: T): boolean
{
    let type = typeof x;
    if (type !== typeof y)
        return false;
    else if (type === "object")
        if (x instanceof Array)
            return array_equal_to(x, y as typeof x);
        else
            return object_equal_to(<any>x as object, <any>y as object);
    else
        return x === y;
}