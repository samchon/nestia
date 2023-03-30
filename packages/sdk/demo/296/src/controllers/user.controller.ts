import { Body, Controller, Delete, Get, Patch } from "@nestjs/common";

import typia from "typia";

import { IFailure, TryCatch } from "../api/structures/exception.interface";
import { IUser } from "../api/structures/user.interface";

@Controller("user")
export class UserController {
    /**
     * @summary 내 상세 정보 보기 API
     * @tag user
     * @returns 사용자 상세 정보
     */
    @Get()
    async getDetail(): Promise<
        TryCatch<
            IUser.Detail,
            IFailure.Business.Invalid | IFailure.Business.Fail
        >
    > {
        return typia.random<
            TryCatch<
                IUser.Detail,
                IFailure.Business.Invalid | IFailure.Business.Fail
            >
        >();
    }

    /**
     * @summary 내 정보 수정 API
     * @tag user
     * @param body 수정할 정보를 포함합니다.
     * @returns 수정된 상세 정보
     */
    @Patch()
    async update(
        @Body() body: IUser.UpdateInput,
    ): Promise<
        TryCatch<
            IUser.Detail,
            | IFailure.Business.Invalid
            | IFailure.Business.NotFound
            | IFailure.Business.Fail
        >
    > {
        body;
        return typia.random<
            TryCatch<
                IUser.Detail,
                | IFailure.Business.Invalid
                | IFailure.Business.NotFound
                | IFailure.Business.Fail
            >
        >();
    }

    /**
     * 사용자는 로그인을 통해 계정을 활성화할 수 있습니다.
     *
     * 비활성화된 계정은 조회되지 않습니다.
     *
     * @summary 내 계정 비활성화 API
     * @tag user
     * @returns true
     */
    @Delete()
    async inActivate(): Promise<
        TryCatch<true, IFailure.Business.Invalid | IFailure.Business.Fail>
    > {
        return typia.random<
            TryCatch<true, IFailure.Business.Invalid | IFailure.Business.Fail>
        >();
    }
}
