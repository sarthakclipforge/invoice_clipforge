export const CURRENCIES = [
    { code: "USD", symbol: "$", locale: "en-US" },
    { code: "EUR", symbol: "€", locale: "de-DE" },
    { code: "GBP", symbol: "£", locale: "en-GB" },
    { code: "INR", symbol: "₹", locale: "en-IN" },
    { code: "JPY", symbol: "¥", locale: "ja-JP" },
    { code: "AED", symbol: "د.إ", locale: "ar-AE" },
    { code: "SGD", symbol: "S$", locale: "en-SG" },
    { code: "AUD", symbol: "A$", locale: "en-AU" },
    { code: "CAD", symbol: "CA$", locale: "en-CA" },
    { code: "CHF", symbol: "CHF", locale: "de-CH" },
    { code: "CNY", symbol: "¥", locale: "zh-CN" },
    { code: "NZD", symbol: "NZ$", locale: "en-NZ" },
];

export function formatMoney(amount, code) {
    const c = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
    return new Intl.NumberFormat(c.locale, { 
        style: "currency", 
        currency: c.code, 
        minimumFractionDigits: 2 
    }).format(amount || 0);
}
