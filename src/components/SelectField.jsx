import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || "");
  const normalizedOptions = options.map(normalizeOption);
  const selectedValue = value ?? uncontrolledValue;
  const selectedOption = normalizedOptions.find((option) => option.value === selectedValue);

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 7;
    const viewportPadding = 16;
    const availableHeight = Math.max(
      120,
      window.innerHeight - rect.bottom - gap - viewportPadding
    );

    setPosition({
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      "--select-max-height": `${Math.min(340, availableHeight)}px`,
      "--select-viewport-max-height": `${Math.min(326, availableHeight - 12)}px`
    });
  }

  function toggle() {
    if (disabled) return;
    if (!open) updatePosition();
    setOpen((current) => !current);
  }

  function choose(nextValue) {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideClick(event) {
      if (
        !triggerRef.current?.contains(event.target) &&
        !contentRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function closeOrReposition(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "keydown") setOpen(false);
      else updatePosition();
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOrReposition);
    window.addEventListener("resize", closeOrReposition);
    window.addEventListener("scroll", closeOrReposition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOrReposition);
      window.removeEventListener("resize", closeOrReposition);
      window.removeEventListener("scroll", closeOrReposition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`select-trigger ${className}`.trim()}
        aria-label={ariaLabel}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) updatePosition();
            setOpen(true);
          }
        }}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className="select-trigger-icon" aria-hidden="true">
          <IconChevronDown size={19} stroke={2} />
        </span>
      </button>
      {open && position
        ? createPortal(
          <div
            ref={contentRef}
            className="select-content"
            role="listbox"
            style={position}
          >
            <div className="select-viewport">
              {normalizedOptions.map((option) => (
                <button
                  type="button"
                  className="select-item"
                  key={option.value}
                  role="option"
                  aria-selected={option.value === selectedValue}
                  data-state={option.value === selectedValue ? "checked" : "unchecked"}
                  disabled={option.disabled}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                  {option.value === selectedValue ? (
                    <span className="select-item-indicator"><IconCheck size={17} stroke={2.4} /></span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
        : null}
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
    </>
  );
}
