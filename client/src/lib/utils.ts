import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return '0';
  }
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 5 
  });
}

export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
    return '$0';
  }
  return `$${formatNumber(price)}`;
}
