import type { ScenarioRuleDataPayload } from '../../app/scenarioApi';

export const completeDoorRuleDataFixture: ScenarioRuleDataPayload = {
  schemaVersion: 2,
  locations: [
    { code: 'sunken-library', name: '水没した閲覧室', description: '禁書と星図が残る開始地点。', atmosphere: '湿った静けさ', danger: '水位が上がり続ける' },
    { code: 'astral-stair', name: '星見の階段', description: '地上へ続く螺旋階段。', atmosphere: '薄い金色の灯り', danger: '扉が閉じている' },
  ],
  objectTypes: [{
    code: 'archive-door', name: '書庫の扉', description: '開閉状態を持つ重い扉。', schemaVersion: 1,
    stateFields: [
      { code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' },
      { code: 'seal-name', label: '封印名', valueType: 'string', defaultValue: 'Aster', visibility: 'private' },
    ],
    actions: [{ code: 'open', label: '扉を開ける', description: '閉じた扉を開く。', visibility: 'ai-choice', availability: 'state-equals', availabilityStateCode: 'open', argumentFields: [] }],
    actionRules: [{
      code: 'generic-open', actionCode: 'open', condition: { op: 'eq', path: 'state.open', value: false }, priority: 100,
      note: '通常の開扉結果。', effects: [{ kind: 'set-state', targetObjectCode: '', stateCode: 'open', value: 'true' }], moduleBinding: null,
    }],
  }],
  objects: [{
    code: 'north-archive-door', name: '北書庫の扉', mixinTypeCodes: ['archive-door'], initialLocationCode: 'sunken-library', global: false,
    stateFields: [], actions: [], initialStateOverrides: [], actionRules: [{
      operation: 'adjust', targetTypeCode: 'archive-door', targetRuleCode: 'generic-open', adjustments: {
        effects: [
          { kind: 'set-state', targetObjectCode: 'north-archive-door', stateCode: 'open', value: 'true' },
          { kind: 'emit-fact', text: '北書庫の扉が開いた。' },
        ],
      },
    }],
  }],
};

export const westDoorAuthoringFixture: ScenarioRuleDataPayload = {
  schemaVersion: 2,
  locations: [
    { code: 'inside', name: '地下研究室', description: '西と東に扉がある室内。', atmosphere: '機械音が低く響く', danger: '出口が閉ざされている' },
    { code: 'outside', name: '研究施設の外', description: '冷たい夜風が吹く屋外。', atmosphere: '星空と夜風', danger: '' },
  ],
  objectTypes: [{
    code: 'openable', name: '開閉可能', description: '開閉状態を提供するmixin。', schemaVersion: 1,
    stateFields: [{ code: 'open', label: '開いている', valueType: 'boolean', defaultValue: 'false', visibility: 'public' }],
    actions: [{ code: 'open', label: '開ける', description: '対象を開く。', visibility: 'ai-choice', availability: 'state-equals', availabilityStateCode: 'open', argumentFields: [] }],
    actionRules: [{ code: 'generic-open', actionCode: 'open', condition: { op: 'eq', path: 'state.open', value: false }, priority: 100, note: 'Type generic rule', effects: [{ kind: 'set-state', targetObjectCode: '', stateCode: 'open', value: 'true' }], moduleBinding: null }],
  }, {
    code: 'exit-door', name: '出口の扉', description: '開閉状態を持ち、外へ出るための扉。', schemaVersion: 1,
    stateFields: [],
    actions: [{ code: 'open-and-exit', label: '扉を開けて外へ出る', description: '扉を開き、そのまま屋外へ移動する。', visibility: 'ai-choice', availability: 'state-equals', availabilityStateCode: 'open', argumentFields: [] }],
    actionRules: [{ code: 'generic-open-and-exit', actionCode: 'open-and-exit', condition: { op: 'eq', path: 'state.open', value: false }, priority: 100, note: '出口共通のrule', effects: [{ kind: 'set-state', targetObjectCode: '', stateCode: 'open', value: 'true' }], moduleBinding: null }],
  }],
  objects: [{
    code: 'west-door', name: '西の扉', mixinTypeCodes: ['openable', 'exit-door'], initialLocationCode: 'inside', global: false,
    stateFields: [{ code: 'direction', label: '方向', valueType: 'string', defaultValue: 'west', visibility: 'public' }],
    actions: [{ code: 'inspect-exit', label: '出口を確認する', description: '出口の様子を確認するObject local action。', visibility: 'ai-choice', availability: 'always', availabilityStateCode: '', argumentFields: [] }],
    initialStateOverrides: [],
    actionRules: [{
      operation: 'override', targetTypeCode: 'exit-door', targetRuleCode: 'generic-open-and-exit',
      rule: {
        code: 'generic-open-and-exit', actionCode: 'open-and-exit', condition: { op: 'eq', path: 'state.open', value: false }, priority: 100,
        note: '西の扉を開けて屋外へ出る決定的な結果。', moduleBinding: null,
        effects: [
          { kind: 'set-state', targetObjectCode: 'west-door', stateCode: 'open', value: 'true' },
          { kind: 'move-session', locationCode: 'outside' },
          { kind: 'emit-fact', text: '西の扉が開いた。' },
          { kind: 'emit-fact', text: 'プレイヤーは研究施設の外へ出た。' },
          { kind: 'emit-event', event: 'session-moved', locationCode: 'outside' },
          { kind: 'add-narrative-hint', text: '冷たい夜風と星空を描写する。' },
          { kind: 'forbid-narrative-fact', text: 'まだ室内にいる' },
          { kind: 'forbid-narrative-fact', text: '扉は閉じたまま' },
        ],
      },
    }, {
      operation: 'add',
      rule: { code: 'west-inspect-exit', actionCode: 'inspect-exit', condition: { op: 'eq', path: 'state.direction', value: 'west' }, priority: 90, note: 'Object local actionをObject local ruleで処理する。', effects: [{ kind: 'emit-fact', text: '西の扉は屋外への出口だ。' }], moduleBinding: null },
    }],
  }],
};
