// ⚠ CHANGE THESE BEFORE YOU GO LIVE.
// Public values — everything here is shown to users who want to buy coins.
// Do NOT put private keys or API secrets here.
export const PAYMENT = {
  // Your PayPal email or paypal.me link. Leave empty to hide the paypal option.
  paypalEmail: "you@example.com",            // TODO: real
  paypalMeLink: "https://paypal.me/yourname",// TODO: real or ""

  // Your USDC wallet address on Base. Leave empty to hide the crypto option.
  usdcBaseAddress: "0x0000000000000000000000000000000000000000", // TODO: real

  // Minimum buy equivalent in USD (both methods).
  minimumPurchaseUsd: 5,

  // How long you usually take to credit coins after payment.
  creditEtaText: "usually within a few hours",

  // Your support / billing email (same as legal contact is fine).
  contactEmail: "hello@randochat.app",
};

// How many coins the user gets per dollar. Adjust to taste.
// Gifts currently cost 5/10/20 coins for heart/fire/star.
export const COINS_PER_USD = 100;
