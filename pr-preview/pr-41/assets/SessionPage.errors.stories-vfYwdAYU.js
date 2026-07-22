import{j as h}from"./jsx-runtime-BO8uF4Og.js";import{w as o,e,u as p}from"./index-C4S39nCK.js";import{M as F,c as U}from"./MyrialeApp-Bdz5qkEr.js";import{M as q}from"./MockSessionContainer-CFFTziMr.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-Cb-Bi4JU.js";import"./Surfaces-CQIJcDfy.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BLjquTkO.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-C73OeBTK.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-E1lLWSiL.js";import"./scenarioWizardStyles-BLXZEqRf.js";import"./SessionActivityFeed-BK8PBvn8.js";import"./account-D2w1pibX.js";import"./ModuleUiHost-Dq6FqUxM.js";const s=a=>function({sessionId:n}){return h.jsx(q,{sessionId:n,scenario:a})},tt={title:"Session/Error states",component:F,args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:U("activeSession")}},d=async a=>{const t=a.getByLabelText("自由に行動や会話を入力");return await p.type(t,"銀の鍵を扉にかざす"),await p.click(a.getByRole("button",{name:"行動を送る"})),t},i={args:{sessionContainer:s("load-401")},play:async({canvasElement:a})=>{const t=o(a);await e(t.getByTestId("session-load-status")).toHaveAttribute("data-notice-kind","authentication-required"),await e(t.getByRole("alert")).toHaveTextContent("ログインの有効期限"),await e(t.getByRole("button",{name:"ログインへ"})).toBeVisible()}},c={args:{sessionContainer:s("load-404")},play:async({canvasElement:a})=>{const t=o(a);await e(t.getByTestId("session-load-status")).toHaveAttribute("data-notice-kind","not-found"),await e(t.getByRole("alert")).toHaveTextContent("Sessionが削除されたか"),await e(t.getByRole("button",{name:"セッション一覧へ"})).toBeVisible()}},r={args:{sessionContainer:s("submit-409")},play:async({canvasElement:a})=>{const t=o(a),n=await d(t);await e(t.getByTestId("dialogue-notice")).toHaveAttribute("data-notice-kind","conflict"),await e(n).toHaveValue("銀の鍵を扉にかざす"),await e(t.getByRole("button",{name:"再読み込み"})).toBeVisible(),await e(t.getByRole("button",{name:"行動を送る"})).toBeVisible()}},l={args:{sessionContainer:s("submit-429")},play:async({canvasElement:a})=>{const t=o(a),n=await d(t);await e(t.getByTestId("dialogue-notice")).toHaveAttribute("data-notice-kind","rate-limited"),await e(n).toHaveValue("銀の鍵を扉にかざす"),await e(t.getByRole("button",{name:"同じ入力を再試行"})).toBeVisible()}},u={args:{sessionContainer:s("load-503")},play:async({canvasElement:a})=>{const t=o(a);await e(t.getByTestId("session-load-status")).toHaveAttribute("data-notice-kind","service-unavailable"),await e(t.getByTestId("session-load-status")).toHaveTextContent("Sessionサービスを利用できません"),await e(t.getByRole("button",{name:"再読み込み"})).toBeVisible()}},m={args:{sessionContainer:s("submit-timeout")},play:async({canvasElement:a})=>{const t=o(a),n=await d(t);await e(t.getByTestId("dialogue-notice")).toHaveAttribute("data-notice-kind","timeout"),await e(t.getByTestId("dialogue-notice")).toHaveTextContent("時間内に返りませんでした"),await e(n).toHaveValue("銀の鍵を扉にかざす"),await e(t.getByRole("button",{name:"同じ入力を再試行"})).toBeVisible()}};var v,g,y;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('load-401')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('session-load-status')).toHaveAttribute('data-notice-kind', 'authentication-required');
    await expect(canvas.getByRole('alert')).toHaveTextContent('ログインの有効期限');
    await expect(canvas.getByRole('button', {
      name: 'ログインへ'
    })).toBeVisible();
  }
}`,...(y=(g=i.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};var b,w,B;c.parameters={...c.parameters,docs:{...(b=c.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('load-404')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('session-load-status')).toHaveAttribute('data-notice-kind', 'not-found');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Sessionが削除されたか');
    await expect(canvas.getByRole('button', {
      name: 'セッション一覧へ'
    })).toBeVisible();
  }
}`,...(B=(w=c.parameters)==null?void 0:w.docs)==null?void 0:B.source}}};var x,T,H;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('submit-409')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    await expect(canvas.getByTestId('dialogue-notice')).toHaveAttribute('data-notice-kind', 'conflict');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', {
      name: '再読み込み'
    })).toBeVisible();
    await expect(canvas.getByRole('button', {
      name: '行動を送る'
    })).toBeVisible();
  }
}`,...(H=(T=r.parameters)==null?void 0:T.docs)==null?void 0:H.source}}};var R,C,V;l.parameters={...l.parameters,docs:{...(R=l.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('submit-429')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    await expect(canvas.getByTestId('dialogue-notice')).toHaveAttribute('data-notice-kind', 'rate-limited');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', {
      name: '同じ入力を再試行'
    })).toBeVisible();
  }
}`,...(V=(C=l.parameters)==null?void 0:C.docs)==null?void 0:V.source}}};var E,S,I;u.parameters={...u.parameters,docs:{...(E=u.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('load-503')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('session-load-status')).toHaveAttribute('data-notice-kind', 'service-unavailable');
    await expect(canvas.getByTestId('session-load-status')).toHaveTextContent('Sessionサービスを利用できません');
    await expect(canvas.getByRole('button', {
      name: '再読み込み'
    })).toBeVisible();
  }
}`,...(I=(S=u.parameters)==null?void 0:S.docs)==null?void 0:I.source}}};var k,A,f;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('submit-timeout')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    await expect(canvas.getByTestId('dialogue-notice')).toHaveAttribute('data-notice-kind', 'timeout');
    await expect(canvas.getByTestId('dialogue-notice')).toHaveTextContent('時間内に返りませんでした');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', {
      name: '同じ入力を再試行'
    })).toBeVisible();
  }
}`,...(f=(A=m.parameters)==null?void 0:A.docs)==null?void 0:f.source}}};const et=["Unauthorized401","NotFound404","Conflict409","RateLimited429","ServiceUnavailable503","RequestTimeout"];export{r as Conflict409,c as NotFound404,l as RateLimited429,m as RequestTimeout,u as ServiceUnavailable503,i as Unauthorized401,et as __namedExportsOrder,tt as default};
