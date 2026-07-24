import{j as F}from"./jsx-runtime-BO8uF4Og.js";import{w as o,e,u as d}from"./index-C4S39nCK.js";import{M as L}from"./MyrialeApp-BaWx72IT.js";import{c as q}from"./SessionPresentation-B4OeLPnd.js";import{M as D}from"./MockSessionContainer-DlNFZEUa.js";/* empty css               */import"./index-D4H_InIO.js";import"./AppChrome-CG0vUER4.js";import"./Surfaces-xpIMDkG0.js";import"./navigationRecipes-DkSbwkz5.js";import"./MyrialeToggle-BJ2tbK4f.js";import"./index-DzKAYa42.js";import"./MyrialeMenu-CtcPHE9S.js";import"./scenarioWizardStyles-DbrtSybi.js";import"./ModuleUiHost-CoZk1x5n.js";import"./account-BQw43enD.js";import"./SessionListPresentation-DJixzVRp.js";import"./SessionIcons-yGOCmQwo.js";import"./SessionTurn-9KUaF1pl.js";import"./SessionActivityFeed-CgkOYOr_.js";const s=a=>function({sessionId:n}){return F.jsx(D,{sessionId:n,scenario:a})},nt={title:"Session/Error states",component:L,args:{initialUrl:"/sessions/SES-PREP-1098",initialDb:q("activeSession")}},v=async a=>{const t=a.getByLabelText("自由に行動や会話を入力");return await d.type(t,"銀の鍵を扉にかざす"),await d.click(a.getByRole("button",{name:"行動を送る"})),t},c={args:{sessionContainer:s("load-401")},play:async({canvasElement:a})=>{const t=o(a);await e(t.getByTestId("session-load-status")).toHaveAttribute("data-notice-kind","authentication-required"),await e(t.getByRole("alert")).toHaveTextContent("ログインの有効期限"),await e(t.getByRole("button",{name:"ログインへ"})).toBeVisible()}},r={args:{sessionContainer:s("load-404")},play:async({canvasElement:a})=>{const t=o(a);await e(t.getByTestId("session-load-status")).toHaveAttribute("data-notice-kind","not-found"),await e(t.getByRole("alert")).toHaveTextContent("Sessionが削除されたか"),await e(t.getByRole("button",{name:"セッション一覧へ"})).toBeVisible()}},l={args:{sessionContainer:s("submit-409")},play:async({canvasElement:a})=>{const t=o(a),n=await v(t),i=t.getByTestId("dialogue-notice");await e(i).toHaveAttribute("data-notice-kind","conflict"),await e(i.classList).toContain("sticky"),await e(i.classList).toContain("top-[126px]"),await e(i.classList).toContain("z-[60]"),await e(n).toHaveValue("銀の鍵を扉にかざす"),await e(t.getByRole("button",{name:"再読み込み"})).toBeVisible(),await e(t.getByRole("button",{name:"行動を送る"})).toBeVisible(),await d.click(t.getByRole("button",{name:"メッセージを閉じる"})),await e(t.queryByTestId("dialogue-notice")).not.toBeInTheDocument()}},u={args:{sessionContainer:s("submit-429")},play:async({canvasElement:a})=>{const t=o(a),n=await v(t);await e(t.getByTestId("dialogue-notice")).toHaveAttribute("data-notice-kind","rate-limited"),await e(n).toHaveValue("銀の鍵を扉にかざす"),await e(t.getByRole("button",{name:"同じ入力を再試行"})).toBeVisible()}},m={args:{sessionContainer:s("load-503")},play:async({canvasElement:a})=>{const t=o(a);await e(t.getByTestId("session-load-status")).toHaveAttribute("data-notice-kind","service-unavailable"),await e(t.getByTestId("session-load-status")).toHaveTextContent("Sessionサービスを利用できません"),await e(t.getByRole("button",{name:"再読み込み"})).toBeVisible()}},p={args:{sessionContainer:s("submit-timeout")},play:async({canvasElement:a})=>{const t=o(a),n=await v(t);await e(t.getByTestId("dialogue-notice")).toHaveAttribute("data-notice-kind","timeout"),await e(t.getByTestId("dialogue-notice")).toHaveTextContent("時間内に返りませんでした"),await e(n).toHaveValue("銀の鍵を扉にかざす"),await e(t.getByRole("button",{name:"同じ入力を再試行"})).toBeVisible()}};var y,g,w;c.parameters={...c.parameters,docs:{...(y=c.parameters)==null?void 0:y.docs,source:{originalSource:`{
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
}`,...(w=(g=c.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var b,B,x;r.parameters={...r.parameters,docs:{...(b=r.parameters)==null?void 0:b.docs,source:{originalSource:`{
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
}`,...(x=(B=r.parameters)==null?void 0:B.docs)==null?void 0:x.source}}};var T,C,R;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    sessionContainer: containerFor('submit-409')
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const input = await submit(canvas);
    const notice = canvas.getByTestId('dialogue-notice');
    await expect(notice).toHaveAttribute('data-notice-kind', 'conflict');
    await expect(notice.classList).toContain('sticky');
    await expect(notice.classList).toContain('top-[126px]');
    await expect(notice.classList).toContain('z-[60]');
    await expect(input).toHaveValue('銀の鍵を扉にかざす');
    await expect(canvas.getByRole('button', {
      name: '再読み込み'
    })).toBeVisible();
    await expect(canvas.getByRole('button', {
      name: '行動を送る'
    })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', {
      name: 'メッセージを閉じる'
    }));
    await expect(canvas.queryByTestId('dialogue-notice')).not.toBeInTheDocument();
  }
}`,...(R=(C=l.parameters)==null?void 0:C.docs)==null?void 0:R.source}}};var H,E,I;u.parameters={...u.parameters,docs:{...(H=u.parameters)==null?void 0:H.docs,source:{originalSource:`{
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
}`,...(I=(E=u.parameters)==null?void 0:E.docs)==null?void 0:I.source}}};var V,k,S;m.parameters={...m.parameters,docs:{...(V=m.parameters)==null?void 0:V.docs,source:{originalSource:`{
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
}`,...(S=(k=m.parameters)==null?void 0:k.docs)==null?void 0:S.source}}};var f,h,A;p.parameters={...p.parameters,docs:{...(f=p.parameters)==null?void 0:f.docs,source:{originalSource:`{
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
}`,...(A=(h=p.parameters)==null?void 0:h.docs)==null?void 0:A.source}}};const ot=["Unauthorized401","NotFound404","Conflict409","RateLimited429","ServiceUnavailable503","RequestTimeout"];export{l as Conflict409,r as NotFound404,u as RateLimited429,p as RequestTimeout,m as ServiceUnavailable503,c as Unauthorized401,ot as __namedExportsOrder,nt as default};
