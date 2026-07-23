# 『星喰いの地下図書館』Moduleデモ Phase 1

## 起動

```bash
./.mux/init
source /root/.config/myriale/dev-path.sh
./scripts/build-demo-modules.py
aspire run
```

`Development`環境ではAPI起動時に`DemoModules/constellation-door-1.0.0.myriale-module`をinstall・enableし、実際のSHA-256 digestを『星喰いの地下図書館』の扉遷移へ固定する。DBを再作成しても同じ手順で復元できる。

## 手動確認

1. 開発用アカウントでログインし、『星喰いの地下図書館』を開始する。
2. 「銀の鍵と星図灯を持って、閉じた星座の扉へ到達する」と入力し、Narrative signalから判定Moduleへ移行する。
3. 判定中に自由入力が無効で、目的・`1d20`・目標値13・補正+2が表示されることを確認する。
4. 「星図灯を掲げて判定する」を押す。UIが送る権威的データは`{ id: "roll" }` intentだけで、出目はhost提供乱数からModuleが決める。
5. 成功時は`constellation-door-opened`、失敗時は`constellation-guardian-awakened` flagが一度だけ設定される。
6. 判定前またはhandoff待ちで再読み込みし、同じExecution revisionと結果が復元されることを確認する。
7. 自動Narrative handoff後に確定結果に沿う描写が追加され、自由入力が再び有効になることを確認する。

成功・失敗の決定論的確認は`ConstellationDoorModuleTests.HostRandomValueDeterminesAuthoritativeOutcome`で固定host乱数を使用する。package生成の再現性は、スクリプトを2回実行したSHA-256 digestの一致で確認する。

## Storybook

```bash
npm run storybook
```

`デモ/星喰いの地下図書館/星座の扉判定`に、active判定と永続handoff待ちのStoryがある。
