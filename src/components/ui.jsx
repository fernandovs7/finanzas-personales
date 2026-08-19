import {
  IconArrowsExchange,
  IconCashBanknote,
  IconCashRegister,
  IconCreditCardPay,
  IconHomeStats,
  IconMoneybag,
  IconPigMoney,
  IconReceiptDollar,
  IconTransactionDollar,
  IconWallet
} from "@tabler/icons-react";

export function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {description ? <p className="section-copy">{description}</p> : null}
    </div>
  );
}

export function HelpHint({ text }) {
  return (
    <span className="hint-wrap" tabIndex={0}>
      <span className="hint-dot" aria-hidden="true">?</span>
      <span className="hint-bubble" role="tooltip">{text}</span>
    </span>
  );
}

export function Icon({ name }) {
  const icons = {
    dashboard: IconHomeStats,
    fixed: IconReceiptDollar,
    liabilities: IconCreditCardPay,
    savings: IconPigMoney,
    movements: IconCashRegister,
    history: IconTransactionDollar,
    available: IconWallet,
    reserve: IconMoneybag,
    convert: IconArrowsExchange,
    card: IconCashBanknote
  };

  const Component = icons[name] || IconHomeStats;

  return (
    <span className={`icon icon-${name}`} aria-hidden="true">
      <Component />
    </span>
  );
}

export function SummaryCard({ title, value, hint, icon }) {
  return (
    <article className="summary-card">
      <div className="summary-head">
        <p className="eyebrow">{title}</p>
        {icon ? <Icon name={icon} /> : null}
      </div>
      <p className="value">{value}</p>
      <p className="hint">{hint}</p>
    </article>
  );
}

export function ListRow({ title, subtitle, amount, amount2, badge }) {
  return (
    <div className={`list-card ${badge ? "" : "no-badge"}`}>
      <div>
        <div className="title">{title}</div>
        <div className="muted">{subtitle}</div>
      </div>
      <div>{amount}</div>
      <div>{amount2}</div>
      {badge ? <div>{badge}</div> : null}
    </div>
  );
}

export function HistoryRow({ item, isEditing, onEdit, onDelete, canDelete = true, children }) {
  return (
    <article className={`history-item ${isEditing ? "editing" : ""}`}>
      <div className="history-row">
        <div className="history-main">
          <div className="history-topline">
            <span className={`pill ${item.pillClass}`}>{item.typeLabel}</span>
            <span className="history-date">{item.date}</span>
          </div>
          <div className="title">{item.title}</div>
          <div className="muted">{item.subtitle}</div>
        </div>
        <div className="history-amounts">
          <strong>{item.amountPrimary}</strong>
          {item.amountSecondary ? <span>{item.amountSecondary}</span> : null}
        </div>
        <div className="history-actions">
          <button type="button" className="ghost-btn" onClick={onEdit}>
            {isEditing ? "Cerrar" : "Editar"}
          </button>
          {canDelete ? (
            <button type="button" className="ghost-btn danger" onClick={onDelete}>
              Borrar
            </button>
          ) : null}
        </div>
      </div>
      {isEditing ? <div className="history-editor">{children}</div> : null}
    </article>
  );
}
