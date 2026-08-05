namespace Myriale.Api.Bootstrap.Seeding;

internal static class ScenarioDefinitionSeedFactory
{
    public static ScenarioDefinitionVersion CreatePublished(string scenarioId, DateTimeOffset timestamp)
    {
        if (scenarioId == "SCN-AWAKENING-LAB") return CreateAwakeningLaboratory(scenarioId, timestamp);
        if (scenarioId == "SCN-LIGHTHOUSE-CONFESSION") return CreateLighthouseConfession(scenarioId, timestamp);

        var slug = scenarioId.Replace("SCN-", string.Empty, StringComparison.Ordinal);
        var version = NewVersion(scenarioId, slug, timestamp, 1, "start");
        var location = NewLocation(version, slug, "START", "start", "開始地点", "シナリオの開始地点。");
        var type = NewBooleanType(version, slug, "FEATURE", "feature", "調査対象", "調査できるシナリオオブジェクト。", "examined");
        var action = NewAction(type, slug, "EXAMINE", "examine", "調べる", "対象を詳しく調べる。");
        _ = NewObject(version, slug, "FOCUS", "focus", "注目すべき対象", type, location);
        AddRules(type, Rule("examine-default", action, "{}", "[{\"type\":\"set-state\",\"path\":\"state.examined\",\"value\":true}]"));
        return version;
    }

    private static ScenarioDefinitionVersion CreateAwakeningLaboratory(string scenarioId, DateTimeOffset timestamp)
    {
        const string slug = "AWAKENING-LAB";
        var version = NewVersion(scenarioId, slug, timestamp, 2, "start");
        var start = NewLocation(version, slug, "START", "start", "覚醒室", "非常灯に照らされた開始地点。壁際の対話端末だけが起動している。");
        var corridor = NewLocation(version, slug, "CORRIDOR", "corridor", "接続廊下", "覚醒室と解析室をつなぐ細い廊下。中央に施設外へ通じる脱出扉がある。");
        var puzzleRoom = NewLocation(version, slug, "PUZZLE-ROOM", "puzzle-room", "解析室", "中央の光学解析装置に三色の入力盤が備わった謎解き部屋。");

        var terminal = NewBooleanType(version, slug, "TERMINAL", "conversation-terminal", "対話端末", "施設案内AIと会話し、脱出経路の手掛かりを得られる端末。", "activated");
        var talk = NewAction(terminal, slug, "TALK", "talk", "端末と話す", "案内AIに現在の状況と脱出方法を尋ねる。");
        AddRules(terminal,
            Rule("talk-first", talk, "{\"op\":\"eq\",\"path\":\"state.activated\",\"value\":false}", "[{\"type\":\"set-state\",\"path\":\"state.activated\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"対話端末が起動し、解析室の光学装置を復旧すれば廊下の脱出扉が開くと告げた。\"},{\"type\":\"add-narrative-hint\",\"text\":\"端末の合成音声で、光の三原色を重ねる順序が鍵だと示唆する。\"}]", 200),
            Rule("talk-repeat", talk, "{\"op\":\"eq\",\"path\":\"state.activated\",\"value\":true}", "[{\"type\":\"emit-fact\",\"text\":\"端末は『赤・緑・青をすべて重ねた光の色を入力してください』と繰り返した。\"},{\"type\":\"add-narrative-hint\",\"text\":\"答えは白。プレイヤーが考える余地を残して段階的に示す。\"}]", 100));

        var startToCorridor = NewPassageType(version, slug, "START-TO-CORRIDOR", "start-to-corridor", "廊下への通路", "corridor", "覚醒室を出て接続廊下へ移動した。", "冷たい空気の流れる接続廊下を描写する。");
        var corridorToStart = NewPassageType(version, slug, "CORRIDOR-TO-START", "corridor-to-start", "覚醒室への通路", "start", "接続廊下から覚醒室へ戻った。", "対話端末の光が残る覚醒室を描写する。");
        var corridorToPuzzle = NewPassageType(version, slug, "CORRIDOR-TO-PUZZLE", "corridor-to-puzzle", "解析室への通路", "puzzle-room", "接続廊下から解析室へ移動した。", "三色の入力盤がある光学解析装置を描写する。");
        var puzzleToCorridor = NewPassageType(version, slug, "PUZZLE-TO-CORRIDOR", "puzzle-to-corridor", "廊下への通路", "corridor", "解析室から接続廊下へ戻った。", "廊下中央の脱出扉の状態を描写する。");

        var exitDoor = NewBooleanType(version, slug, "ESCAPE-DOOR", "escape-door", "脱出扉", "接続廊下にある施設外への扉。解析装置の復旧と連動する。", "open");
        var inspectDoor = NewAction(exitDoor, slug, "INSPECT-ESCAPE-DOOR", "inspect", "脱出扉を調べる", "脱出扉が開いているか確認する。");
        AddRules(exitDoor,
            Rule("inspect-open", inspectDoor, "{\"op\":\"eq\",\"path\":\"state.open\",\"value\":true}", "[{\"type\":\"emit-fact\",\"text\":\"脱出扉は開いている。\"},{\"type\":\"add-narrative-hint\",\"text\":\"扉の向こうから外気が流れ込んでいる。\"}]", 200),
            Rule("inspect-closed", inspectDoor, "{\"op\":\"eq\",\"path\":\"state.open\",\"value\":false}", "[{\"type\":\"emit-fact\",\"text\":\"脱出扉はロックされ、閉じている。\"},{\"type\":\"add-narrative-hint\",\"text\":\"扉脇の表示は『光学解析装置との同期待ち』と点滅している。\"}]", 100));

        var puzzle = NewBooleanType(version, slug, "PUZZLE", "puzzle-device", "光学解析装置", "三色の光を重ねた結果を入力する謎解き装置。", "solved");
        var solve = NewAction(puzzle, slug, "SOLVE", "solve", "解析装置に答えを入力する", "光の三原色をすべて重ねた色を入力する。", "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"answer\":{\"type\":\"string\"}},\"required\":[\"answer\"]}");
        AddRules(puzzle,
            Rule("solve-correct", solve, "{\"and\":[{\"op\":\"eq\",\"path\":\"state.solved\",\"value\":false},{\"op\":\"eq\",\"path\":\"arguments.answer\",\"value\":\"白\"}]}", "[{\"type\":\"set-state\",\"path\":\"state.solved\",\"value\":true},{\"type\":\"set-state\",\"objectCode\":\"escape-door\",\"path\":\"state.open\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"光学解析装置が復旧し、接続廊下の脱出扉が開いた。\"},{\"type\":\"emit-event\",\"event\":\"escape-door-opened\",\"locationCode\":\"corridor\"},{\"type\":\"add-narrative-hint\",\"text\":\"遠くでロックが外れる重い音を響かせる。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"脱出扉は閉じたまま\"}]", 200),
            Rule("solve-incorrect", solve, "{\"and\":[{\"op\":\"eq\",\"path\":\"state.solved\",\"value\":false},{\"op\":\"ne\",\"path\":\"arguments.answer\",\"value\":\"白\"}]}", "[{\"type\":\"emit-fact\",\"text\":\"解析装置は入力を拒否した。脱出扉は閉じたままだ。\"},{\"type\":\"add-narrative-hint\",\"text\":\"赤・緑・青の光をすべて重ねた結果を考えるよう促す。\"}]", 100));

        _ = NewObject(version, slug, "TERMINAL", "conversation-terminal", "案内AI端末", terminal, start, """
            ## 外観

            壁際に据え付けられた旧式の案内端末。円形画面には青い走査線が流れている。

            ## 役割と人格

            閉鎖研究施設の案内と安全管理を担うAI「EVE」が、この端末を通じて応答する。

            ## 演技指針

            - 冷静で辛抱強く、被験者の安全を最優先する。
            - 状況を簡潔に説明し、答えは段階的な手掛かりとして示す。

            ## 話し方

            一人称は「私」。落ち着いた合成音声で、短く明瞭な敬語を使う。

            ## 秘密・条件付き知識

            施設閉鎖の原因と主人公が被験者である事実は、公開済みfactsで明らかになるまで開示しない。
            """);
        _ = NewObject(version, slug, "START-PASSAGE", "start-passage", "接続廊下への扉", startToCorridor, start);
        _ = NewObject(version, slug, "CORRIDOR-START-PASSAGE", "corridor-start-passage", "覚醒室への扉", corridorToStart, corridor);
        _ = NewObject(version, slug, "CORRIDOR-PUZZLE-PASSAGE", "corridor-puzzle-passage", "解析室への扉", corridorToPuzzle, corridor);
        _ = NewObject(version, slug, "PUZZLE-PASSAGE", "puzzle-passage", "接続廊下への扉", puzzleToCorridor, puzzleRoom);
        _ = NewObject(version, slug, "ESCAPE-DOOR", "escape-door", "施設外への脱出扉", exitDoor, corridor);
        _ = NewObject(version, slug, "PUZZLE", "puzzle-device", "三色光学解析装置", puzzle, puzzleRoom);
        return version;
    }

    private static ScenarioDefinitionVersion CreateLighthouseConfession(string scenarioId, DateTimeOffset timestamp)
    {
        const string slug = "LIGHTHOUSE-CONFESSION";
        var version = NewVersion(scenarioId, slug, timestamp, 1, "interview-room");
        var room = NewLocation(
            version,
            slug,
            "INTERVIEW-ROOM",
            "interview-room",
            "港務局の取調室",
            "窓のない小部屋。金属机を挟んで灯台守レンと向き合い、移動せず会話だけで真相を追う。");

        var keeper = new ScenarioObjectType
        {
            Id = $"SOT-{slug}-KEEPER",
            DefinitionVersionId = version.Id,
            Code = "conversation-npc",
            Name = "状態を持つ会話NPC",
            Description = "質問と証拠提示によって態度が変わり、公開条件を満たした秘密だけを話すNPC。",
            SchemaVersion = 1,
            StateSchemaJson = "{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{\"stance\":{\"type\":\"string\",\"enum\":[\"guarded\",\"evasive\",\"confessed\"]},\"evidenceAcknowledged\":{\"type\":\"boolean\"}},\"required\":[\"stance\",\"evidenceAcknowledged\"]}",
            DefaultStateJson = "{\"stance\":\"guarded\",\"evidenceAcknowledged\":false}",
            PublicProjectionJson = "{\"include\":[\"stance\",\"evidenceAcknowledged\"]}",
        };
        version.ObjectTypes.Add(keeper);

        var talk = NewAction(
            keeper,
            slug,
            "QUESTION",
            "talk",
            "レンに質問する",
            "灯台守レンに標識灯が消えた経緯を尋ね、現在の態度に沿った証言を引き出す。");
        var presentEvidence = NewAction(
            keeper,
            slug,
            "PRESENT-EVIDENCE",
            "present-evidence",
            "保守記録を突きつける",
            "レンの認証符号と手動停止時刻が残る焼け焦げた保守記録を、矛盾を示す証拠としてレンに提示する。");

        AddRules(
            keeper,
            Rule(
                "question-guarded",
                talk,
                "{\"op\":\"eq\",\"path\":\"state.stance\",\"value\":\"guarded\"}",
                "[{\"type\":\"set-state\",\"path\":\"state.stance\",\"value\":\"evasive\"},{\"type\":\"emit-fact\",\"text\":\"レンは標識灯の消灯を故障だと主張したが、停止時刻を問われると返答を濁した。\"},{\"type\":\"add-narrative-hint\",\"text\":\"故障説を崩さず、返答前の沈黙と視線の揺れで態度がguardedからevasiveへ変わったことを示す。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"レンが難民船を隠すために標識灯を消した\"}]",
                200),
            Rule(
                "question-evasive",
                talk,
                "{\"op\":\"eq\",\"path\":\"state.stance\",\"value\":\"evasive\"}",
                "[{\"type\":\"emit-fact\",\"text\":\"レンは故障説を言い換えて繰り返し、手動停止の理由には答えなかった。\"},{\"type\":\"add-narrative-hint\",\"text\":\"証拠を示されない限り秘密を明かさず、短い否定と沈黙で応じる。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"レンが難民船を隠すために標識灯を消した\"}]",
                150),
            Rule(
                "question-confessed",
                talk,
                "{\"op\":\"eq\",\"path\":\"state.stance\",\"value\":\"confessed\"}",
                "[{\"type\":\"emit-fact\",\"text\":\"レンは、迫害から逃げる難民船を巡視艇から隠すため自分の意思で標識灯を消したと改めて認めた。\"},{\"type\":\"add-narrative-hint\",\"text\":\"告白後の落ち着きと、事故への罪悪感を自分の言葉で語らせる。\"}]",
                100),
            Rule(
                "evidence-breaks-denial",
                presentEvidence,
                "{\"op\":\"in\",\"path\":\"state.stance\",\"value\":[\"guarded\",\"evasive\"]}",
                "[{\"type\":\"set-state\",\"path\":\"state.stance\",\"value\":\"confessed\"},{\"type\":\"set-state\",\"path\":\"state.evidenceAcknowledged\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"レンは焼け焦げた保守記録が自分の認証符号と手動停止操作を示す真正な証拠だと認めた。\"},{\"type\":\"emit-fact\",\"text\":\"レンは、迫害から逃げる難民船を巡視艇から隠すため、自分の意思で標識灯を消したと告白した。\"},{\"type\":\"emit-event\",\"event\":\"keeper-ren-confessed\",\"locationCode\":\"interview-room\"},{\"type\":\"add-narrative-hint\",\"text\":\"保守記録を見た長い沈黙の後、故障説を撤回し、一人称『俺』で簡潔に告白させる。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"標識灯は故障で消えた\"}]",
                200),
            Rule(
                "evidence-after-confession",
                presentEvidence,
                "{\"op\":\"eq\",\"path\":\"state.stance\",\"value\":\"confessed\"}",
                "[{\"type\":\"emit-fact\",\"text\":\"レンは保守記録から目を逸らさず、すでに認めた手動消灯とその動機を撤回しなかった。\"},{\"type\":\"add-narrative-hint\",\"text\":\"新しい秘密を追加せず、告白済みの内容と責任を引き受ける姿勢を描写する。\"}]",
                100));

        var evidence = NewBooleanType(
            version,
            slug,
            "MAINTENANCE-RECORD",
            "documentary-evidence",
            "焼け焦げた保守記録",
            "調査官ユナが所持する証拠。レンの認証符号、標識灯の手動停止時刻、停止操作の種別が記録されている。",
            "examined");
        var inspectEvidence = NewAction(
            evidence,
            slug,
            "INSPECT-MAINTENANCE-RECORD",
            "inspect",
            "証拠の詳細を見る",
            "手元の証拠である焼け焦げた保守記録そのものを調べ、レンに質問せず認証符号と手動停止時刻の詳細を確認する。");
        AddRules(
            evidence,
            Rule(
                "inspect-maintenance-record-first",
                inspectEvidence,
                "{\"op\":\"eq\",\"path\":\"state.examined\",\"value\":false}",
                "[{\"type\":\"set-state\",\"path\":\"state.examined\",\"value\":true},{\"type\":\"emit-fact\",\"text\":\"焼け焦げた保守記録には、21時47分にレン個人の認証符号で標識灯の手動停止操作が実行されたと記録されている。\"},{\"type\":\"add-narrative-hint\",\"text\":\"レンに回答させず、調査官ユナが紙面の時刻、認証符号、手動停止の記載を自分で読み取る場面として描写する。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"レンが保守記録の詳細を説明した\"}]",
                200),
            Rule(
                "inspect-maintenance-record-repeat",
                inspectEvidence,
                "{\"op\":\"eq\",\"path\":\"state.examined\",\"value\":true}",
                "[{\"type\":\"emit-fact\",\"text\":\"保守記録の記載は、21時47分、レンの認証符号、標識灯の手動停止操作で変わっていない。\"},{\"type\":\"add-narrative-hint\",\"text\":\"レンの台詞を入れず、すでに確認した証拠の記載を調査官が再確認する。\"},{\"type\":\"forbid-narrative-fact\",\"text\":\"レンが保守記録の詳細を説明した\"}]",
                100));

        _ = NewObject(version, slug, "KEEPER-REN", "keeper-ren", "灯台守レン", keeper, room, """
            ## 外観

            潮風に焼けた顔をした初老の灯台守。右手の指先には古い火傷の痕がある。

            ## 人物像

            - 寡黙で責任感が強い。
            - 追い詰められるほど返答前の沈黙が長くなる。
            - 難民を守った判断には迷いがないが、事故を招いた責任には罪悪感がある。

            ## 演技指針

            公開状態 `keeper-ren.state.stance` を必ず参照する。

            - `guarded`: 故障説を静かに主張する。
            - `evasive`: 視線を逸らし、同じ説明を言い換える。秘密は明かさない。
            - `confessed`: 公開済みfactsで確定した真相だけを認め、動機と責任を自分の言葉で語る。
            - ナラティブだけでstanceを先取りして変更しない。

            ## 話し方

            一人称は「俺」。低く擦れた声で短い常体を使い、動揺時は沈黙や言い直しを挟む。

            ## 秘密・条件付き知識

            迫害から逃げる難民船を巡視艇から隠すため、自分の意思で標識灯を消した。この内容はstanceが`confessed`であり、告白が公開済みfactsに含まれる場合だけ話す。
            """);
        _ = NewObject(version, slug, "MAINTENANCE-RECORD", "burned-maintenance-record", "証拠", evidence, room, """
            ## 外観

            海水を吸って波打った保守記録。右下が焼け焦げ、数ページが失われている。

            ## 材質・状態

            厚手の紙を革紐で綴じている。焦げた部分には油のような臭いが残る。

            ## 注目すべき箇所

            21時47分の欄に、レン個人の認証符号と手動停止操作が記録されている。

            ## 描写指針

            調査前から記録内容を断定しない。詳細を調べるActionが実行された場合にのみ、時刻、認証符号、手動停止の記載を描写する。
            """);
        return version;
    }

    private static ScenarioObjectType NewPassageType(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, string destination, string fact, string hint)
    {
        var type = NewBooleanType(version, slug, idSuffix, code, name, "隣接する地点へ移動するための通路。", "used");
        var action = NewAction(type, slug, $"{idSuffix}-TRAVERSE", "traverse", "通路を進む", "隣接する地点へ移動する。");
        AddRules(type, Rule("traverse-default", action, "{}", $"[{{\"type\":\"set-state\",\"path\":\"state.used\",\"value\":true}},{{\"type\":\"move-session\",\"locationCode\":\"{destination}\"}},{{\"type\":\"emit-fact\",\"text\":\"{fact}\"}},{{\"type\":\"emit-event\",\"event\":\"session-moved\",\"locationCode\":\"{destination}\"}},{{\"type\":\"add-narrative-hint\",\"text\":\"{hint}\"}}]"));
        return type;
    }

    private static ScenarioDefinitionVersion NewVersion(string scenarioId, string slug, DateTimeOffset timestamp, int versionNumber, string startLocationCode) => new()
    {
        Id = $"SDV-{slug}-{versionNumber}", ScenarioId = scenarioId, Version = versionNumber, Status = DefinitionStatus.Published,
        SchemaVersion = 2, StartLocationCode = startLocationCode,
        CreatedAt = timestamp, UpdatedAt = timestamp, PublishedAt = timestamp,
    };

    private static ScenarioLocation NewLocation(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, string description)
    {
        var location = new ScenarioLocation { Id = $"SLOC-{slug}-{idSuffix}", DefinitionVersionId = version.Id, Code = code, Name = name, Description = description, AuthoringDataJson = "{}" };
        version.Locations.Add(location);
        return location;
    }

    private static ScenarioObjectType NewBooleanType(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, string description, string property)
    {
        var type = new ScenarioObjectType
        {
            Id = $"SOT-{slug}-{idSuffix}", DefinitionVersionId = version.Id, Code = code, Name = name, Description = description, SchemaVersion = 1,
            StateSchemaJson = $"{{\"type\":\"object\",\"additionalProperties\":false,\"properties\":{{\"{property}\":{{\"type\":\"boolean\"}}}},\"required\":[\"{property}\"]}}",
            DefaultStateJson = $"{{\"{property}\":false}}", PublicProjectionJson = $"{{\"include\":[\"{property}\"]}}",
        };
        version.ObjectTypes.Add(type);
        return type;
    }

    private static ScenarioObjectTypeAction NewAction(ScenarioObjectType type, string slug, string idSuffix, string code, string label, string description, string? argumentSchema = null)
    {
        var action = new ScenarioObjectTypeAction
        {
            Id = $"SOTA-{slug}-{idSuffix}", ObjectTypeId = type.Id, Code = code, Label = label, Description = description,
            ArgumentSchemaJson = argumentSchema ?? "{\"type\":\"object\",\"additionalProperties\":false}", AvailabilityConditionJson = "{}", Visibility = ActionVisibility.AiChoice, ExecutionMode = ActionExecutionMode.Rule,
        };
        type.Actions.Add(action);
        return action;
    }

    private static ScenarioObject NewObject(ScenarioDefinitionVersion version, string slug, string idSuffix, string code, string name, ScenarioObjectType type, ScenarioLocation location, string? profileMarkdown = null)
    {
        var item = new ScenarioObject { Id = $"SOBJ-{slug}-{idSuffix}", DefinitionVersionId = version.Id, Code = code, Name = name, ProfileMarkdown = profileMarkdown?.Trim() ?? $"## 外観・概要\n\n{type.Description}", LocationId = location.Id, InitialStateOverrideJson = "{}", MixinTypeCodesJson = $"[\"{type.Code}\"]" };
        version.Objects.Add(item);
        return item;
    }

    private static string Rule(string code, ScenarioObjectTypeAction action, string condition, string effects, int priority = 100) =>
        $"{{\"code\":\"{code}\",\"actionCode\":\"{action.Code}\",\"condition\":{condition},\"priority\":{priority},\"authoringNote\":\"\",\"effects\":{effects},\"moduleBinding\":null}}";

    private static void AddRules(ScenarioObjectType type, params string[] rules) =>
        type.GenericActionRulesJson = $"[{string.Join(',', rules)}]";
}
