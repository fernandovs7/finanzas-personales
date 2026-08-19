export const money = (amount, currency = "CRC") =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CRC" ? 0 : 2
  }).format(amount || 0);
