export interface ISuccess<T> {
    readonly type: "success";
    readonly data: T;
}

export interface IFailure<
    T extends IFailure.Type = IFailure.Type,
    E extends string = string,
> {
    readonly type: T;
    readonly event: E;
    readonly message: string;
}

export type Try<T> = ISuccess<T>;

export type TryCatch<T, E extends IFailure> = ISuccess<T> | E;

export namespace IFailure {
    export type Type = "internal" | "business";
    /**
     * 애플리케이션 내부적으로 발생하는 예외 사항
     *
     * 클라이언트에게 전달되지 않고 내부에서 처리되어야 한다.
     *
     * ex) DB같은 외부 시스템 및 라이브러리 오류
     */
    export type Internal<T extends Internal.Type = Internal.Type> = IFailure<
        "internal",
        T
    >;

    export namespace Internal {
        export type Type = "Invalid" | "Fail";
        /**
         * 사용하는 데이터가 유효하지 않은 경우
         *
         * ex) DB가 정상적으로 응답했으나, 예측한 것과 다른 경우 발생 가능
         *
         * ex) 함수의 인자가 유효하지 않은 경우
         */
        export type Invalid = Internal<"Invalid">;

        /**
         * DB등의 외부 시스템의 연결이 정상적인 응답을 하지 않은 경우
         */
        export type Fail = Internal<"Fail">;
    }

    /**
     * 서비스 논리상 발생하는 예외 사항
     *
     * 클라이언트에게 전달될 수 있다.
     * */
    export type Business<T extends Business.Type = Business.Type> = IFailure<
        "business",
        T
    >;

    export namespace Business {
        export type Type = "NotFound" | "Invalid" | "Forbidden" | "Fail";
        /**
         * 요청한 대상을 찾지 못함
         */
        export type NotFound = Business<"NotFound">;

        /**
         * 요청이 유효하지 않음
         *
         * 비정상적인 방식으로 접근하거나 함수의 input이 적절하지 않음
         */
        export type Invalid = Business<"Invalid">;

        /**
         * 요청이 차단됨
         *
         * 요청자가 권한이 없는 경우
         */
        export type Forbidden = Business<"Forbidden">;

        /**
         * 요청이 실패함
         */
        export type Fail = Business<"Fail">;
    }
}
