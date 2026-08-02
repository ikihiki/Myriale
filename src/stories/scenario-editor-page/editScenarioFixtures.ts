import type { ScenarioFormValues } from '../../features/scenario/@components/scenarioFormModel';
import { completeDoorRuleDataFixture } from '../scenario-registration-page/scenarioRegistrationFixtures';

export const editScenarioFixture: ScenarioFormValues = {
  title: '目覚めの研究室',
  summary: '# シナリオ\n閉鎖された地下研究施設から脱出します。\n# 描写\n- 緊張感のある静かな雰囲気を維持する',
  genre: 'SF,ミステリー,脱出劇',
  aiFreedom: '低: 厳密に守る',
  heroMode: 'free',
  heroFreeGenerationAllowed: false,
  hero: '記憶を失った人物として自由に作成する。',
  opening: 'あなたは閉鎖された地下研究施設で目を覚ます。',
  illustrationStyle: '冷たい研究施設のコンセプトアート',
  illustrationMood: '静かな緊張感',
  illustrationNegative: '明るい屋外、コミカルな表現',
  sampleScene: '非常灯だけが点滅する無人の実験室。',
  ruleData: structuredClone(completeDoorRuleDataFixture),
};
