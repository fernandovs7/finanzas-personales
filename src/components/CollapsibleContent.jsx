export function CollapsibleContent({ open, children }) {
  return (
    <div
      className={`collapsible-content ${open ? "open" : ""}`}
      aria-hidden={open ? undefined : true}
      inert={!open}
    >
      <div className="collapsible-content-inner">{children}</div>
    </div>
  );
}
