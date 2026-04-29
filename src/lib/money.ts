export const formatCOP = (value: number | string, options: { decimals?: number } = {}) => {
  const amount = Number(value) || 0;
  const decimals = options.decimals ?? 2;

  return `COP $${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};