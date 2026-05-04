# typia에서 Nestia가 배워야 할 점

## 1. 포팅은 알고리즘 보존이다

Go로 옮긴다는 말은 Go식 설계로 재작성한다는 뜻이 아니다. `typia@next`는 원본 파일과 identifier를 최대한 보존했다. Nestia도 `TypedRouteProgrammer.generate`, `SdkOperationProgrammer.write`, `ReflectHttpOperationParameterAnalyzer.analyze` 같은 이름과 구조를 보존해야 한다.

## 2. JS package는 얇게 유지한다

`typia@next`의 JS transform file은 native source를 가리키는 manifest다. Nestia도 consumer-facing package는 TS/JS package로 유지하되 compiler work는 Go sidecar가 한다.

## 3. setup wizard가 생태계를 바꾼다

typia setup은 `ts-patch`를 제거하고 `ttsc`, `@typescript/native-preview`를 설치한다. Nestia setup도 같은 전환을 해야 한다.

현재 Nestia setup은 반대로 `ts-patch`와 `ts-node`를 설치하고 `prepare`에 `ts-patch install`을 넣는다. 이 부분은 포팅 초기에 반드시 제거 대상이다.

## 4. generate path는 `TtscCompiler.transform()`을 쓸 수 있다

typia generate wizard는 `new TtscCompiler(...).transform()`으로 source를 변환한 뒤 파일을 쓴다. Nestia SDK CLI도 config/controller metadata 준비에 `TtscCompiler.compile()` 또는 transform/compile hybrid를 써야 한다.

## 5. printer cleanup은 필수지만 위험하다

typia native transform은 TypeScript-Go printer output을 후처리한다. Nestia decorator syntax와 metadata literal은 formatting에 민감할 수 있다. 따라서 cleanup rule은 최소화하고 golden output test를 둬야 한다.

