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