import * as nest from '@nestjs/common';

import core from "@nestia/core";
import typia from 'typia';

/**
 * test clone dto type using Parital Util type
 */
@nest.Controller("partial-dto-test")
export class PartialDTOTestController{
    @core.TypedRoute.Get("original")
    async original(): Promise<IOriginal> {
        return typia.random<IOriginal>();
    }

    @core.TypedRoute.Post('partial-interface')
    async partialInterface(
        @core.TypedBody() body: IOriginal.IPartialInterface
    ): Promise<IPartialInterface> {
        body;
        return {};
    }

    @core.TypedRoute.Post('partial-type')
    async partialType(
        @core.TypedBody() body: IOriginal.IPartialType
    ): Promise<IPartialType> {
        body
        return {};
    }
}

interface IOriginal {
    a:string;
    b:string;
    c:string;
    d:string;
    /** @format email */
    email: string | null;
    created_at: ( string & typia.tags.Format<'date-time'>) | null;
    original_optional?: boolean;
    undefinable_attr: string | undefined;
}

interface IPartialInterface extends Partial<Pick<IOriginal,"a" | "email" | "created_at" | "original_optional" | "undefinable_attr">> {};
type IPartialType = Partial<Pick<IOriginal,"b" | "email" | "created_at" | "original_optional" | "undefinable_attr">>;

namespace IOriginal {
   export interface IPartialInterface extends Partial<Pick<IOriginal,"c" | "email" | "created_at" | "original_optional" | "undefinable_attr">> {};
   export type IPartialType = Partial<Pick<IOriginal,"d" | "email" | "created_at" | "original_optional" | "undefinable_attr">>;
}