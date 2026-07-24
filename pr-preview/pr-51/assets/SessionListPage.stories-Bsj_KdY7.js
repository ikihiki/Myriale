import{j as d}from"./jsx-runtime-BO8uF4Og.js";import{r as I}from"./index-D4H_InIO.js";import{f as n,w as o,e as a,u as s}from"./index-C4S39nCK.js";import{S as H}from"./SessionListPresentation-BxuhmsOg.js";import"./Surfaces-xpIMDkG0.js";import"./AppChrome-BaZraqhs.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";const u={id:"SES-LIVE-1098",status:"active",scenarioTitle:"星喰いの地下図書館",heroName:"リュカ",turnLabel:"第14ターン",summary:"禁書庫の扉を開き、星図に刻まれた次の道を探している。",updatedLabel:"2026/07/23 19:30"},B={id:"SES-DONE-2042",status:"completed",scenarioTitle:"灰の駅と宛名のない切符",heroName:"ノア",turnLabel:"第31ターン",summary:"夜明けを運ぶ列車を見送り、旅を終えた。",updatedLabel:"2026/07/20 22:10"},p=n(),y=n(),K={title:"ユーザーストーリー/Session list",component:H,args:{account:{name:"ミリア",email:"reader@myriale.example",initials:"ミリ",role:"Reader"},state:{status:"ready",sessions:[u]},showCompleted:!1,onShowCompletedChange:n(),onOpenSession:p,onFindScenario:y,onRetry:n(),onLogout:n()}},i={play:async({canvasElement:t})=>{const e=o(t);await a(e.getByText("星喰いの地下図書館")).toBeVisible(),await s.click(e.getByRole("button",{name:"この物語に戻る"})),await a(p).toHaveBeenCalledWith("SES-LIVE-1098")}};function O({onlyCompleted:t=!1}){const[e,j]=I.useState(!1),D={status:"ready",sessions:e?t?[B]:[u,B]:t?[]:[u]};return d.jsx(H,{account:{name:"ミリア",email:"reader@myriale.example",initials:"ミリ",role:"Reader"},state:D,showCompleted:e,onShowCompletedChange:j,onOpenSession:p,onFindScenario:y,onRetry:n(),onLogout:n()})}const c={render:()=>d.jsx(O,{}),play:async({canvasElement:t})=>{const e=o(t);await a(e.queryByText("灰の駅と宛名のない切符")).not.toBeInTheDocument(),await s.click(e.getByRole("checkbox",{name:/完了済みも表示/})),await a(e.getByRole("region",{name:"完了済みのセッション"})).toBeVisible(),await a(e.getByText("灰の駅と宛名のない切符")).toBeVisible(),await s.click(e.getByRole("button",{name:"物語を読み返す"})),await a(p).toHaveBeenCalledWith("SES-DONE-2042")}},r={render:()=>d.jsx(O,{onlyCompleted:!0}),play:async({canvasElement:t})=>{const e=o(t);await a(e.getByText("進行中のセッションはありません")).toBeVisible(),await s.click(e.getByRole("checkbox",{name:/完了済みも表示/})),await a(e.getByText("灰の駅と宛名のない切符")).toBeVisible(),await a(e.getByText("進行中のセッションはありません")).toBeVisible(),await s.click(e.getByRole("button",{name:"シナリオを探す"})),await a(y).toHaveBeenCalled()}},l={args:{state:{status:"ready",sessions:[]}},play:async({canvasElement:t})=>{const e=o(t);await a(e.getByText("進行中のセッションはありません")).toBeVisible(),await s.click(e.getByRole("button",{name:"シナリオを探す"})),await a(y).toHaveBeenCalled()}},m={args:{state:{status:"error",message:"セッション一覧を読み込めませんでした。"}},play:async({canvasElement:t})=>{await a(o(t).getByRole("button",{name:"もう一度読み込む"})).toBeVisible()}};var g,w,v;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('星喰いの地下図書館')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: 'この物語に戻る'
    }));
    await expect(openSession).toHaveBeenCalledWith('SES-LIVE-1098');
  }
}`,...(v=(w=i.parameters)==null?void 0:w.docs)==null?void 0:v.source}}};var x,S,b;c.parameters={...c.parameters,docs:{...(x=c.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <CompletedToggleStory />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('灰の駅と宛名のない切符')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('checkbox', {
      name: /完了済みも表示/
    }));
    await expect(canvas.getByRole('region', {
      name: '完了済みのセッション'
    })).toBeVisible();
    await expect(canvas.getByText('灰の駅と宛名のない切符')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: '物語を読み返す'
    }));
    await expect(openSession).toHaveBeenCalledWith('SES-DONE-2042');
  }
}`,...(b=(S=c.parameters)==null?void 0:S.docs)==null?void 0:b.source}}};var E,h,R;r.parameters={...r.parameters,docs:{...(E=r.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <CompletedToggleStory onlyCompleted />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('進行中のセッションはありません')).toBeVisible();
    await userEvent.click(canvas.getByRole('checkbox', {
      name: /完了済みも表示/
    }));
    await expect(canvas.getByText('灰の駅と宛名のない切符')).toBeVisible();
    await expect(canvas.getByText('進行中のセッションはありません')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: 'シナリオを探す'
    }));
    await expect(findScenario).toHaveBeenCalled();
  }
}`,...(R=(h=r.parameters)==null?void 0:h.docs)==null?void 0:R.source}}};var T,C,V;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    state: {
      status: 'ready',
      sessions: []
    }
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('進行中のセッションはありません')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: 'シナリオを探す'
    }));
    await expect(findScenario).toHaveBeenCalled();
  }
}`,...(V=(C=l.parameters)==null?void 0:C.docs)==null?void 0:V.source}}};var k,f,L;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    state: {
      status: 'error',
      message: 'セッション一覧を読み込めませんでした。'
    }
  },
  play: async ({
    canvasElement
  }) => {
    await expect(within(canvasElement).getByRole('button', {
      name: 'もう一度読み込む'
    })).toBeVisible();
  }
}`,...(L=(f=m.parameters)==null?void 0:f.docs)==null?void 0:L.source}}};const M=["進行中の物語を開く","完了済みの物語を表示する","完了済みだけでも新規開始できる","セッションがない","読み込み失敗から再試行する"];export{M as __namedExportsOrder,K as default,l as セッションがない,r as 完了済みだけでも新規開始できる,c as 完了済みの物語を表示する,m as 読み込み失敗から再試行する,i as 進行中の物語を開く};
