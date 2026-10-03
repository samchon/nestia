import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IGoogleDriveFile } from "../../structures/generic/IGoogleDriveFile";
import { IGoogleDriveImageSingleUpload } from "../../structures/generic/IGoogleDriveImageSingleUpload";
import { IGoogleTokenActivate } from "../../structures/generic/IGoogleTokenActivate";

@Controller("body_rich/generic/google/:accountCode/drives/images/upload")
export class GenericGoogleDriveImageUploadController {
  /**
   * 단일 이미지 파일 업로드.
   *
   * 단 하나의 이미지 파일을 구글 드라이브에 개별 업로드한다.
   *
   * @param accountCode 구글 계정명
   * @param input 단일 이미지 파일 업로드 정보
   * @returns 업로드 완료된 구글 드라이브 파일 정보
   * @tag Google
   */
  @TypedRoute.Post("single")
  public async single(
    @TypedParam("accountCode") accountCode: string,
    @TypedBody() input: IGoogleDriveImageSingleUpload,
  ): Promise<IGoogleDriveFile> {
    accountCode;
    input;
    return typia.random<IGoogleDriveFile>();
  }

  @TypedRoute.Post("activate")
  public async activate(
    @TypedParam("accountCode") accountCode: string,
    @TypedBody() input: IGoogleTokenActivate<"google-auth">,
  ): Promise<void> {
    accountCode;
    input;
  }
}
