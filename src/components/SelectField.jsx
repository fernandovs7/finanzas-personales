import * as Select from "@radix-ui/react-select";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";

function normalizeOption(option) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function SelectField({
  value,
  defaultValue,
  onValueChange,
  name,
  options,
  placeholder = "Seleccionar",
  ariaLabel,
  disabled = false,
  className = ""
}) {
  return (
    <Select.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
    >
      <Select.Trigger
        className={`select-trigger ${className}`.trim()}
        aria-label={ariaLabel}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="select-trigger-icon">
          <IconChevronDown size={19} stroke={2} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="select-content"
          position="popper"
          sideOffset={7}
          collisionPadding={12}
        >
          <Select.Viewport className="select-viewport">
            {options.map(normalizeOption).map((option) => (
              <Select.Item
                className="select-item"
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="select-item-indicator">
                  <IconCheck size={17} stroke={2.4} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
