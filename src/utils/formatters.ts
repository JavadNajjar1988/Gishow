// Persian number and price formatting utility

export const toPersianDigits = (num: number | string): string => {
  if (num === null || num === undefined) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
};

export const formatPrice = (price: number): string => {
  const formatted = price.toLocaleString('fa-IR');
  return `${formatted} تومان`;
};

export const generateTrackingCode = (): string => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TRK-${rand}`;
};

export const generateFactorNumber = (): string => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `GSH-${rand}`;
};

export const generateRefId = (gateway: string): string => {
  const prefix = gateway.toUpperCase().slice(0, 3);
  const rand = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}-${rand}`;
};
