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

export type TryCatch<T, E extends ValueOfError> = ResponseForm<T> | E;

@nest.Controller()
export class AppController {
    @core.TypedRoute.Get("only")
    OnlyOneErrorObject(): TryCatch<100, typeof ERROR.TOO_LONG_KEY_NAME1> {
        /**
         * If it's not zero, then return ERROR object.
         */
        let something: number = 0;

        if (something === 1) {
            return ERROR.TOO_LONG_KEY_NAME1;
        }

        return { result: true, code: 1000, data: 100 };
    }

    @core.TypedRoute.Get("many")
    ManyErrorObjects(): TryCatch<
        100,
        | typeof ERROR.TOO_LONG_KEY_NAME1
        | typeof ERROR.TOO_LONG_KEY_NAME2
        | typeof ERROR.TOO_LONG_KEY_NAME3
        | typeof ERROR.TOO_LONG_KEY_NAME4
        | typeof ERROR.TOO_LONG_KEY_NAME5
    > {
        /**
         * If it's not zero, then return ERROR object.
         */
        let something: number = 0;

        if (something === 1) {
            return ERROR.TOO_LONG_KEY_NAME1;
        } else if (something === 2) {
            return ERROR.TOO_LONG_KEY_NAME2;
        } else if (something === 3) {
            return ERROR.TOO_LONG_KEY_NAME3;
        } else if (something === 4) {
            return ERROR.TOO_LONG_KEY_NAME4;
        } else if (something === 5) {
            return ERROR.TOO_LONG_KEY_NAME5;
        }

        return { result: true, code: 1000, data: 100 };
    }
}
