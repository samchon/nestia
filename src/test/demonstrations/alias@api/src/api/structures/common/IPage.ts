/**
 * 페이지 처리된 레코드 셋.
 * 
 * @author Samchon
 */
export interface IPage<T extends object>
{
    /**
     * 페이지 정보
     */
    pagination: IPage.IPagination;

    /**
     * 레코드 리스트
     */
    data: T[];
}
export namespace IPage
{
    /**
     * 페이지 정보
     */
    export interface IPagination
    {
        /**
         * 현재의 페이지 번호
         */
        page: number;

        /**
         * 개별 페이지 당 레코드 수 제한
         * 
         * @default 100
         */
        limit: number;

        /**
         * 전체 레코드 수
         */
        total_count: number;

        /**
         * 전체 페이지 수
         */
        total_pages: number;
    }

    /**
     * 페이지 요청정보
     */
    export interface IRequest<Field extends string = string>
    {
        /**
         * 페이지 번호
         */
        page?: number;

        /**
         * 각 페이지 당 레코드 수 제한
         */
        limit?: number;

        /**
         * 검색 필드
         */
        search_fields?: Field[];

        /**
         * 검색 값
         */
        search_value?: string;

        /**
         * 정렬 기준, 필드명을 부호와 함께 입력하면 됨
         * 
         *   - 단순 필드명 입력 (`id`): 오름차순
         *   - 양부호 사용 (`+id`): 오름차순
         *   - 음부호 사용 (`-id`): 내림차순
         */
        sort?: string;
    }
}