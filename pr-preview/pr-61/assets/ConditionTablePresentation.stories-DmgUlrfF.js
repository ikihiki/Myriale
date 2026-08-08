import{j as l}from"./jsx-runtime-BO8uF4Og.js";import{r as g}from"./index-D4H_InIO.js";import{w as t,e as a,u as s}from"./index-C4S39nCK.js";import{C as d}from"./ConditionTablePresentation-lAGcOeS6.js";/* empty css               */import"./Surfaces-hfywbPiG.js";import"./EditPane-CacH2v8L.js";import"./MyrialeToggle-CSioTFV0.js";import"./navigationRecipes-DkSbwkz5.js";import"./index-DzKAYa42.js";const u=[{code:"open",label:"開いている",valueType:"boolean",defaultValue:"false",visibility:"public"}];function C(){const[e,n]=g.useState({kind:"comparison",operator:"eq",source:"state",path:"open",valueType:"boolean",value:!1});return l.jsx("div",{className:"max-w-3xl p-6",children:l.jsx(d,{label:"実行条件",value:e,onChange:n,stateFields:u})})}const A={title:"シナリオ/実行条件テーブル",component:d},r={args:{label:"実行条件",value:{kind:"always"},stateFields:u,onChange:()=>{}},render:()=>l.jsx(C,{}),play:async({canvasElement:e,step:n})=>{const o=t(e),i=t(e.ownerDocument.body);await n("実行条件の要約をテーブルで確認する",async()=>{await a(o.getByRole("table",{name:"実行条件 table"})).toHaveTextContent("状態：open ＝")}),await n("nested EditPaneでAND条件を追加し、閉じた後の要約を更新する",async()=>{await s.click(o.getByRole("button",{name:"ルートの実行条件を編集"}));const c=i.getByRole("dialog",{name:"実行条件を編集"});await a(c).toHaveAttribute("data-layer","2"),await s.click(t(c).getByRole("combobox",{name:"実行条件の条件種別"})),await s.click(await i.findByRole("option",{name:"すべて成立（AND）"})),await s.click(t(c).getByRole("button",{name:"子条件を追加"})),await s.click(t(c).getByRole("button",{name:"実行条件の編集を完了"})),await a(o.getByRole("table",{name:"実行条件 table"})).toHaveTextContent("AND 2")})}},p={args:{label:"実行条件",value:{kind:"unsupported",canonical:{op:"future",path:"state.open",value:!0}},onChange:()=>{},stateFields:u},render:e=>l.jsx("div",{className:"max-w-3xl p-6",children:l.jsx(d,{...e})}),play:async({canvasElement:e,step:n})=>{const o=t(e);await n("未対応conditionをlossless read-only行として説明する",async()=>{const i=o.getByRole("table",{name:"実行条件 table"});await a(i).toHaveTextContent("未対応の条件"),await a(i).toHaveTextContent("内容を変更せず保持"),await a(t(i).queryByRole("button")).not.toBeInTheDocument(),await a(o.getByRole("note")).toHaveTextContent("内容を変更せず保存します")})}};var m,y,v;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    label: '実行条件',
    value: {
      kind: 'always'
    },
    stateFields,
    onChange: () => undefined
  },
  render: () => <EditableConditionStory />,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await step('実行条件の要約をテーブルで確認する', async () => {
      await expect(canvas.getByRole('table', {
        name: '実行条件 table'
      })).toHaveTextContent('状態：open ＝');
    });
    await step('nested EditPaneでAND条件を追加し、閉じた後の要約を更新する', async () => {
      await userEvent.click(canvas.getByRole('button', {
        name: 'ルートの実行条件を編集'
      }));
      const pane = screen.getByRole('dialog', {
        name: '実行条件を編集'
      });
      await expect(pane).toHaveAttribute('data-layer', '2');
      await userEvent.click(within(pane).getByRole('combobox', {
        name: '実行条件の条件種別'
      }));
      await userEvent.click(await screen.findByRole('option', {
        name: 'すべて成立（AND）'
      }));
      await userEvent.click(within(pane).getByRole('button', {
        name: '子条件を追加'
      }));
      await userEvent.click(within(pane).getByRole('button', {
        name: '実行条件の編集を完了'
      }));
      await expect(canvas.getByRole('table', {
        name: '実行条件 table'
      })).toHaveTextContent('AND 2');
    });
  }
}`,...(v=(y=r.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var w,b,x;p.parameters={...p.parameters,docs:{...(w=p.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    label: '実行条件',
    value: {
      kind: 'unsupported',
      canonical: {
        op: 'future',
        path: 'state.open',
        value: true
      }
    },
    onChange: () => undefined,
    stateFields
  },
  render: args => <div className="max-w-3xl p-6"><ConditionTablePresentation {...args} /></div>,
  play: async ({
    canvasElement,
    step
  }) => {
    const canvas = within(canvasElement);
    await step('未対応conditionをlossless read-only行として説明する', async () => {
      const table = canvas.getByRole('table', {
        name: '実行条件 table'
      });
      await expect(table).toHaveTextContent('未対応の条件');
      await expect(table).toHaveTextContent('内容を変更せず保持');
      await expect(within(table).queryByRole('button')).not.toBeInTheDocument();
      await expect(canvas.getByRole('note')).toHaveTextContent('内容を変更せず保存します');
    });
  }
}`,...(x=(b=p.parameters)==null?void 0:b.docs)==null?void 0:x.source}}};const j=["EditNestedCondition","UnsupportedConditionIsReadOnly"];export{r as EditNestedCondition,p as UnsupportedConditionIsReadOnly,j as __namedExportsOrder,A as default};
