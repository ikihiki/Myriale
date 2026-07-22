import{j as a}from"./jsx-runtime-BO8uF4Og.js";import{S as t}from"./SessionTurn-BRW8fD64.js";import{b as m}from"./MyrialeToggle-Cu4mkWU9.js";/* empty css               */import"./index-D4H_InIO.js";import"./index-DzKAYa42.js";const u=e=>a.jsx("div",{className:"block bg-[#efe6d2] p-4",children:a.jsx("div",{className:"grid gap-2.5",children:e})}),N={title:"コンポーネント/SessionTurn",component:t,parameters:{layout:"padded",notes:"AI対話プレイとプログラム主導シーンで共有するターン表示コンポーネント。どちらも「ユーザー入力（lead） → その結果（AI Narrative）」の順で統一され、lead.tone（player / program）だけが異なります。"}},r={name:"Playground（Controls）",argTypes:{narrative:{control:"text",description:"AI Narrative（結果の本文）"},narrativeTag:{control:"text",description:"Narrative のタグチップ（例: AI）"},selected:{control:"boolean",description:"選択中の強調表示"},variant:{control:"select",options:["none","turn-dialogue","turn-battle","turn-roll","turn-event"],description:"モード別アクセント（variantClassName）"},showLead:{control:"boolean",description:"lead（入力/事実）ブロックを表示するか"},leadTone:{control:"inline-radio",options:["player","program"],description:"lead の種類（player=プレイヤー入力 / program=確定事実）"},leadTag:{control:"text",description:"lead 先頭のタグ（例: ⟶ / PROGRAM）"},leadText:{control:"text",description:"lead の本文（入力テキスト/確定事実）"},showHeadingAction:{control:"boolean",description:"見出しに操作ボタンを置くか"},showInterpretation:{control:"boolean",description:"プレイヤー入力(lead)の中に解釈トグルと解釈パネルを表示するか"},interpretationText:{control:"text",description:"lead 内に表示する解釈の本文"}},args:{narrative:"鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。",narrativeTag:"",selected:!1,variant:"none",showLead:!0,leadTone:"player",leadTag:"⟶",leadText:"懐の銀の鍵を取り出して刻印を見る",showHeadingAction:!0,showInterpretation:!0,interpretationText:"所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。"},render:e=>u(a.jsx(t,{narrative:e.narrative,narrativeTag:e.narrativeTag||void 0,selected:e.selected,variantClassName:e.variant==="none"?"":e.variant,headingActions:e.showHeadingAction?a.jsx("button",{type:"button",children:"ここまで戻る"}):void 0,lead:e.showLead?{tone:e.leadTone,tag:e.leadTag,srLabel:e.leadTone==="player"?"プレイヤーの入力: ":void 0,text:e.leadText,actions:e.leadTone==="player"&&e.showInterpretation?a.jsx(m,{className:"!justify-self-start !rounded-full !border !border-[#7c5cff]/30 !bg-white/55 !px-2.5 !py-1 !text-[11px] !font-extrabold !text-[#6044d4] data-[state=on]:!bg-[#7c5cff]/16 data-[state=on]:!text-[#4a32b0]",pressed:!0,children:"⌄ 解釈を隠す"}):void 0,detail:e.leadTone==="player"&&e.showInterpretation?a.jsxs("p",{className:"m-0 flex max-w-none items-baseline gap-2 rounded-xl bg-[#d9a441]/18 px-3 py-2.5 text-[13px] font-semibold text-[#4b3a20]",children:[a.jsx("span",{className:"shrink-0 text-[#b07a16]","aria-hidden":"true",children:"⚙"}),e.interpretationText]}):void 0}:void 0}))},n={name:"Samples（ギャラリー）",render:()=>u(a.jsxs(a.Fragment,{children:[a.jsx(t,{narrative:"あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。"}),a.jsx(t,{headingActions:a.jsx("button",{type:"button",children:"ここまで戻る"}),lead:{tone:"player",tag:"⟶",srLabel:"プレイヤーの入力: ",text:"懐の銀の鍵を取り出して刻印を見る",actions:a.jsx(m,{className:"!justify-self-start !rounded-full !border !border-[#7c5cff]/30 !bg-white/55 !px-2.5 !py-1 !text-[11px] !font-extrabold !text-[#6044d4] data-[state=on]:!bg-[#7c5cff]/16 data-[state=on]:!text-[#4a32b0]",pressed:!0,children:"⌄ 解釈を隠す"}),detail:a.jsxs("p",{className:"m-0 flex max-w-none items-baseline gap-2 rounded-xl bg-[#d9a441]/18 px-3 py-2.5 text-[13px] font-semibold text-[#4b3a20]",children:[a.jsx("span",{className:"shrink-0 text-[#b07a16]","aria-hidden":"true",children:"⚙"}),"所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。"]})},narrative:"鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。"}),a.jsx(t,{selected:!0,lead:{tone:"player",tag:"⟶",srLabel:"プレイヤーの入力: ",text:"星図灯を掲げて螺旋階段をのぼる"},narrative:"星図灯を掲げると、螺旋階段の先で同じ光がひとつ、応えるように灯った。"}),a.jsx(t,{ariaLabel:"ログ battle",variantClassName:"turn-battle",lead:{tone:"program",tag:"PROGRAM",text:"行動「スキル」確定: 与ダメージ12 / 被ダメージ4 → 敵HP 12 / 自HP 26"},narrative:"あなたのスキルが決まり、書架番の装甲がきしむ。冷たい火花が散った。",narrativeTag:"AI"}),a.jsx(t,{ariaLabel:"ログ roll",variantClassName:"turn-roll",lead:{tone:"program",tag:"PROGRAM",text:"ダイス: d6 = 5（成功・しきい値4）"},narrative:"錆を噛んだ閂が砕け、扉が軋みながら開く。先へ進める。",narrativeTag:"AI"})]}))};var o,s,i,l,d;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  name: 'Playground（Controls）',
  argTypes: {
    narrative: {
      control: 'text',
      description: 'AI Narrative（結果の本文）'
    },
    narrativeTag: {
      control: 'text',
      description: 'Narrative のタグチップ（例: AI）'
    },
    selected: {
      control: 'boolean',
      description: '選択中の強調表示'
    },
    variant: {
      control: 'select',
      options: ['none', 'turn-dialogue', 'turn-battle', 'turn-roll', 'turn-event'],
      description: 'モード別アクセント（variantClassName）'
    },
    showLead: {
      control: 'boolean',
      description: 'lead（入力/事実）ブロックを表示するか'
    },
    leadTone: {
      control: 'inline-radio',
      options: ['player', 'program'],
      description: 'lead の種類（player=プレイヤー入力 / program=確定事実）'
    },
    leadTag: {
      control: 'text',
      description: 'lead 先頭のタグ（例: ⟶ / PROGRAM）'
    },
    leadText: {
      control: 'text',
      description: 'lead の本文（入力テキスト/確定事実）'
    },
    showHeadingAction: {
      control: 'boolean',
      description: '見出しに操作ボタンを置くか'
    },
    showInterpretation: {
      control: 'boolean',
      description: 'プレイヤー入力(lead)の中に解釈トグルと解釈パネルを表示するか'
    },
    interpretationText: {
      control: 'text',
      description: 'lead 内に表示する解釈の本文'
    }
  },
  args: {
    narrative: '鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。',
    narrativeTag: '',
    selected: false,
    variant: 'none',
    showLead: true,
    leadTone: 'player',
    leadTag: '⟶',
    leadText: '懐の銀の鍵を取り出して刻印を見る',
    showHeadingAction: true,
    showInterpretation: true,
    interpretationText: '所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。'
  },
  render: args => inLog(<SessionTurn narrative={args.narrative} narrativeTag={args.narrativeTag || undefined} selected={args.selected} variantClassName={args.variant === 'none' ? '' : args.variant} headingActions={args.showHeadingAction ? <button type="button">ここまで戻る</button> : undefined} lead={args.showLead ? {
    tone: args.leadTone,
    tag: args.leadTag,
    srLabel: args.leadTone === 'player' ? 'プレイヤーの入力: ' : undefined,
    text: args.leadText,
    actions: args.leadTone === 'player' && args.showInterpretation ? <MyrialeToggle className="!justify-self-start !rounded-full !border !border-[#7c5cff]/30 !bg-white/55 !px-2.5 !py-1 !text-[11px] !font-extrabold !text-[#6044d4] data-[state=on]:!bg-[#7c5cff]/16 data-[state=on]:!text-[#4a32b0]" pressed>
                      ⌄ 解釈を隠す
                    </MyrialeToggle> : undefined,
    detail: args.leadTone === 'player' && args.showInterpretation ? <p className="m-0 flex max-w-none items-baseline gap-2 rounded-xl bg-[#d9a441]/18 px-3 py-2.5 text-[13px] font-semibold text-[#4b3a20]">
                      <span className="shrink-0 text-[#b07a16]" aria-hidden="true">⚙</span>
                      {args.interpretationText}
                    </p> : undefined
  } : undefined} />)
}`,...(i=(s=r.parameters)==null?void 0:s.docs)==null?void 0:i.source},description:{story:"Playground — Controls でプロパティをいじって試すページ。",...(d=(l=r.parameters)==null?void 0:l.docs)==null?void 0:d.description}}};var p,c,x,g,b;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  name: 'Samples（ギャラリー）',
  render: () => inLog(<>
        <SessionTurn narrative="あなたは水没した閲覧室で目を覚ます。膝まで届く黒い水の上を星図灯の光が揺れ、崩れた書架の奥から誰かの咳払いが聞こえる。" />
        <SessionTurn headingActions={<button type="button">ここまで戻る</button>} lead={{
      tone: 'player',
      tag: '⟶',
      srLabel: 'プレイヤーの入力: ',
      text: '懐の銀の鍵を取り出して刻印を見る',
      actions: <MyrialeToggle className="!justify-self-start !rounded-full !border !border-[#7c5cff]/30 !bg-white/55 !px-2.5 !py-1 !text-[11px] !font-extrabold !text-[#6044d4] data-[state=on]:!bg-[#7c5cff]/16 data-[state=on]:!text-[#4a32b0]" pressed>
                ⌄ 解釈を隠す
              </MyrialeToggle>,
      detail: <p className="m-0 flex max-w-none items-baseline gap-2 rounded-xl bg-[#d9a441]/18 px-3 py-2.5 text-[13px] font-semibold text-[#4b3a20]">
                <span className="shrink-0 text-[#b07a16]" aria-hidden="true">⚙</span>
                所持品確認として解釈しました。目的は銀の鍵の由来と使い道を知ることです。
              </p>
    }} narrative="鍵の柄には、星座ではなく空白の円が刻まれていた。指でなぞると、水面にまだ開いていない扉の輪郭が一瞬だけ浮かぶ。" />
        <SessionTurn selected lead={{
      tone: 'player',
      tag: '⟶',
      srLabel: 'プレイヤーの入力: ',
      text: '星図灯を掲げて螺旋階段をのぼる'
    }} narrative="星図灯を掲げると、螺旋階段の先で同じ光がひとつ、応えるように灯った。" />
        <SessionTurn ariaLabel="ログ battle" variantClassName="turn-battle" lead={{
      tone: 'program',
      tag: 'PROGRAM',
      text: '行動「スキル」確定: 与ダメージ12 / 被ダメージ4 → 敵HP 12 / 自HP 26'
    }} narrative="あなたのスキルが決まり、書架番の装甲がきしむ。冷たい火花が散った。" narrativeTag="AI" />
        <SessionTurn ariaLabel="ログ roll" variantClassName="turn-roll" lead={{
      tone: 'program',
      tag: 'PROGRAM',
      text: 'ダイス: d6 = 5（成功・しきい値4）'
    }} narrative="錆を噛んだ閂が砕け、扉が軋みながら開く。先へ進める。" narrativeTag="AI" />
      </>)
}`,...(x=(c=n.parameters)==null?void 0:c.docs)==null?void 0:x.source},description:{story:"Samples — 代表的な使い方を並べたギャラリー。",...(b=(g=n.parameters)==null?void 0:g.docs)==null?void 0:b.description}}};const A=["Playground","Samples"];export{r as Playground,n as Samples,A as __namedExportsOrder,N as default};
