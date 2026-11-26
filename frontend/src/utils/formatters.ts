/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron Enterprise — Utility Formatters
   Professional data formatting utilities for currency, percentages, and units.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Formats a number as a currency string.
 * @param value The numeric value to format
 * @param abbreviate Whether to abbreviate large numbers (e.g., 1.2M)
 */
export function formatCurrency(value: number, abbreviate: boolean = false): string {
    if (abbreviate) {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Helper to parse and format a string that might contain a dollar sign and commas.
 */
export function formatStringAsCurrency(val: string): string {
    const numeric = parseFloat(val.replace(/[$,]/g, ''));
    if (isNaN(numeric)) return val;
    return formatCurrency(numeric);
}
