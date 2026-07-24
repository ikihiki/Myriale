# 『星喰いの地下図書館』旧 Module デモ TODO（廃止）

この TODO は、旧 progression/Module handoff ベースライン向けの実装記録であり、accepted Object-rule engine plan により廃止された。旧 contract、package、active Session/Module Execution、進行 receipt を新 baseline へ移行する要件はない。

現在のデモ要件と確認手順は [`docs/demo/star-eater-underground-library-phase-1.md`](../demo/star-eater-underground-library-phase-1.md) を参照する。

新しい責務分担は次のとおりである。

- 通常の星座の扉は Location、Object Type、Object placement、declarative action result で実装する。
- 複雑な守護者戦だけを Object action result に固定された extension module として実装する。
- AI は公開 action snapshot から `{objectId, actionId, arguments}` を選び、rule/extension commit 後の narrative を生成する。
- state、placement、effect、extension identity は pinned Scenario definition と rule engine が確定する。
- 新 contract/schema/artifact と rebuilt package は baseline `1` / `.v1` / `1.0.0` から開始する。
- revisions、sequences、SHA-256 digest、dependency/toolchain/application versions は reset しない。
