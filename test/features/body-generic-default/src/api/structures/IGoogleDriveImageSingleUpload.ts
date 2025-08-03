import { tags } from "typia";

import { Placeholder } from "./Placeholder";
import { SecretKey } from "./SecretKey";

/**
 * 구글 드라이브에의 이미지 업로드 DTO.
 *
 * 구글 드라이브에 단일 이미지를 업로드할 때 사용하는 DTO. 만일 복수의 이미지를 동시에 업로드하고 싶다면,
 * `IGoogleDriveImageMultipleUpload` DTO 및 관련 API 함수를 사용하도록 할 것.
 *
 * @author Samchon
 */
export interface IGoogleDriveImageSingleUpload {
  /**
   * 구글 사용자 인증 키.
   *
   * 구글 드라이브에 이미지 파일을 업로드하기 위하여, 구글 사용자 인증이 선행되어야 한다. 본 필드값에는, 바로 그 사전 인증하여 발급받은
   * 사용자 인증 키를 할당해주어야 함. 그리고 그 인증 키는, read 및 write scope 에 대하여 대응 가능하여야 한다.
   */
  token: string & SecretKey<"google-auth-key">;

  /**
   * 이미지 파일 경로.
   *
   * Workflow Editor 상 Inspector 내지 Chat Agent 의 File Uploader 의하여 구성됨.
   */
  url: string &
    tags.Format<"uri"> &
    (tags.ContentMediaType<"image/png"> | tags.ContentMediaType<"image/jpg">);

  /**
   * 이미지 파일이 위치할 경로, 파일명 및 확장자는 제외.
   *
   * @title 파일 경로
   */
  location: string;

  /**
   * 파일명.
   *
   * 확장자가 제외된, 순수 파일명.
   *
   * {@link url} 의 실제 파일명과 다르게 업로드 가능.
   */
  name: string & Placeholder<"파일명을 입력해주세요.">;

  /** 이미지 확장자. */
  extension: "jpg" | "png";
}
