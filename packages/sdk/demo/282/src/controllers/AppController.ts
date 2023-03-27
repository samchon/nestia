import core from "@nestia/core";
import * as nest from "@nestjs/common";

export const ERROR = {
    TOO_LONG_KEY_NAME1: {
        result: false,
        code: 4000,
        data: "Error happens something1.",
    },
    TOO_LONG_KEY_NAME2: {
        result: false,
        code: 4000,
        data: "Error happens something2.",
    },
    TOO_LONG_KEY_NAME3: {
        result: false,
        code: 4000,
        data: "Error happens something3.",
    },
    TOO_LONG_KEY_NAME4: {
        result: false,
        code: 4000,
        data: "Error happens something4.",
    },
    TOO_LONG_KEY_NAME5: {
        result: false,
        code: 4000,
        data: "Error happens something5.",
    },
} as const;

type KeyOfError = keyof typeof ERROR;
type ValueOfError = (typeof ERROR)[KeyOfError];
interface ResponseForm<T> {
    result: true;
    code: 1000;
    data: T;
}

export type Try<T, E extends ValueOfError> = ResponseForm<T> | E;

@nest.Controller()
export class AppController {
    @core.TypedRoute.Get("omg")
    public async ThisFunctionHasTooLongReturnType(): Promise<
        Try<
            true,
            | typeof ERROR.TOO_LONG_KEY_NAME1
            | typeof ERROR.TOO_LONG_KEY_NAME2
            | typeof ERROR.TOO_LONG_KEY_NAME3
            | typeof ERROR.TOO_LONG_KEY_NAME4
            | typeof ERROR.TOO_LONG_KEY_NAME5
        >
    > {
        /**
         * If it's not zero, then return ERROR object.
         */
        let something: number = 0;
        if (something === 0) {
            return { result: true, code: 1000, data: true };
        } else if (something === 1) {
            return ERROR.TOO_LONG_KEY_NAME1;
        } else if (something === 2) {
            return ERROR.TOO_LONG_KEY_NAME2;
        } else if (something === 3) {
            return ERROR.TOO_LONG_KEY_NAME3;
        } else if (something === 4) {
            return ERROR.TOO_LONG_KEY_NAME4;
        } else {
            return ERROR.TOO_LONG_KEY_NAME5;
        }
    }
}
