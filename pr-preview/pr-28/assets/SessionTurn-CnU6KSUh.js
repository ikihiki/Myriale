import{j as t}from"./jsx-runtime-BO8uF4Og.js";function h({lead:e}){return t.jsxs("div",{className:`session-turn-lead lead-${e.tone}`,"data-testid":e.testId,children:[t.jsxs("p",{className:"session-turn-lead-line",children:[t.jsx("span",{className:`session-turn-lead-tag tag-${e.tone}`,"aria-hidden":"true",children:e.tag}),e.srLabel&&t.jsx("span",{className:"sr-only",children:e.srLabel}),t.jsx("span",{className:"session-turn-lead-text",children:e.text})]}),e.actions&&t.jsx("div",{className:"session-turn-lead-actions",children:e.actions}),e.detail]})}function m({headingActions:e,lead:a,narrative:r,narrativeTag:n,narrativeTestId:s,selected:i=!1,variantClassName:l="",ariaLabel:d,testId:o,articleRef:c}){const u=t.jsxs("p",{className:"session-turn-narrative","data-testid":s,children:[n&&t.jsx("span",{className:"session-turn-narrative-tag","aria-hidden":"true",children:n}),r]}),p=a?t.jsx(h,{lead:a}):null;return t.jsxs("article",{className:`session-turn ${i?"selected":""} ${l}`.trim(),"aria-label":d,"data-testid":o,ref:c,children:[e&&t.jsx("div",{className:"session-turn-heading",children:t.jsx("div",{className:"session-turn-actions",children:e})}),p,u]})}m.__docgenInfo={description:"",methods:[],displayName:"SessionTurn",props:{headingActions:{required:!1,tsType:{name:"ReactNode"},description:'Trailing heading slot (e.g. a "ここまで戻る" button).'},lead:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  tone: TurnLeadTone;
  /** Short glyph/label chip shown before the text (e.g. "⟶" or "PROGRAM"). */
  tag: string;
  /** Screen-reader label for the lead text (e.g. "プレイヤーの入力: "). */
  srLabel?: string;
  text: ReactNode;
  /** Optional testid for the lead block. */
  testId?: string;
  /**
   * Controls shown inside the lead, directly under the input/fact line
   * (e.g. an interpretation toggle for a player input).
   */
  actions?: ReactNode;
  /**
   * Expandable detail rendered inside the lead, under the actions
   * (e.g. how the player input was interpreted).
   */
  detail?: ReactNode;
}`,signature:{properties:[{key:"tone",value:{name:"union",raw:"'player' | 'program'",elements:[{name:"literal",value:"'player'"},{name:"literal",value:"'program'"}],required:!0}},{key:"tag",value:{name:"string",required:!0},description:'Short glyph/label chip shown before the text (e.g. "⟶" or "PROGRAM").'},{key:"srLabel",value:{name:"string",required:!1},description:'Screen-reader label for the lead text (e.g. "プレイヤーの入力: ").'},{key:"text",value:{name:"ReactNode",required:!0}},{key:"testId",value:{name:"string",required:!1},description:"Optional testid for the lead block."},{key:"actions",value:{name:"ReactNode",required:!1},description:`Controls shown inside the lead, directly under the input/fact line
(e.g. an interpretation toggle for a player input).`},{key:"detail",value:{name:"ReactNode",required:!1},description:`Expandable detail rendered inside the lead, under the actions
(e.g. how the player input was interpreted).`}]}},description:`Lead block shown *before* the Narrative: the user input (AI dialogue) or the
program-confirmed action/fact (program-driven). The turn always reads
input → result.`},narrative:{required:!0,tsType:{name:"ReactNode"},description:"AI Narrative body (the result of the lead)."},narrativeTag:{required:!1,tsType:{name:"string"},description:'Tag chip for the Narrative (e.g. "AI"); omitted when not needed.'},narrativeTestId:{required:!1,tsType:{name:"string"},description:"Optional testid for the Narrative paragraph."},selected:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}},variantClassName:{required:!1,tsType:{name:"string"},description:"Extra class for accent variants (e.g. `turn-battle`).",defaultValue:{value:"''",computed:!1}},ariaLabel:{required:!1,tsType:{name:"string"},description:""},testId:{required:!1,tsType:{name:"string"},description:""},articleRef:{required:!1,tsType:{name:"signature",type:"function",raw:"(node: HTMLElement | null) => void",signature:{arguments:[{type:{name:"union",raw:"HTMLElement | null",elements:[{name:"HTMLElement"},{name:"null"}]},name:"node"}],return:{name:"void"}}},description:"Ref callback for the article element (used for scroll-into-view)."}}};export{m as S};
