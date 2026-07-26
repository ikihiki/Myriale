import { useId, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import * as Select from '@radix-ui/react-select';
import { getEditPaneFloatingZIndex, useEditPaneLayer, useEditPanePortalHost } from '../../shared/editPaneLayer';
import type { MyrialeOption } from './types';

export function MyrialeSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = '選択してください',
  help,
  id,
  testId,
}: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: MyrialeOption[];
  placeholder?: string;
  help?: string;
  id?: string;
  testId?: string;
}) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const suppressTriggerClickRef = useRef(false);
  const editPaneLayer = useEditPaneLayer();
  const editPanePortalHost = useEditPanePortalHost();
  const floatingZIndex = editPaneLayer === null ? undefined : getEditPaneFloatingZIndex(editPaneLayer);
  const handleTriggerPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!open || event.button !== 0 || event.ctrlKey) return;
    event.preventDefault();
    suppressTriggerClickRef.current = true;
    window.setTimeout(() => { suppressTriggerClickRef.current = false; }, 0);
    setOpen(false);
  };
  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!suppressTriggerClickRef.current) return;
    suppressTriggerClickRef.current = false;
    event.preventDefault();
  };

  return (
    <div className="myr-ui-field">
      <label htmlFor={triggerId}>{label}</label>
      <Select.Root value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
        <Select.Trigger id={triggerId} className="myr-ui-select-trigger" aria-label={label} data-testid={testId} style={open ? { pointerEvents: 'auto' } : undefined} onPointerDown={handleTriggerPointerDown} onClick={handleTriggerClick}>
          <Select.Value placeholder={placeholder} />
          <Select.Icon className="myr-ui-select-icon" aria-hidden="true">⌄</Select.Icon>
        </Select.Trigger>
        <Select.Portal container={editPanePortalHost}>
          <Select.Content
            className="myr-ui-surface myr-ui-select-content"
            data-edit-pane-floating-layer={editPaneLayer ?? undefined}
            style={floatingZIndex === undefined ? undefined : { zIndex: floatingZIndex }}
            position="popper"
            sideOffset={8}
          >
            <Select.ScrollUpButton className="myr-ui-select-scroll">▲</Select.ScrollUpButton>
            <Select.Viewport className="myr-ui-select-viewport">
              {options.map((option) => (
                <Select.Item key={option.value} value={option.value} className="myr-ui-select-item">
                  <Select.ItemText>
                    <span className="myr-ui-select-label">{option.label}</span>
                    {option.description && <span className="myr-ui-select-description">{option.description}</span>}
                  </Select.ItemText>
                  <Select.ItemIndicator className="myr-ui-select-check">✓</Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="myr-ui-select-scroll">▼</Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {help && <p className="myr-ui-help">{help}</p>}
    </div>
  );
}
