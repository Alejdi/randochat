// ⚠ CHANGE THESE BEFORE YOU GO LIVE.
// Public values — everything here is shown to users who want to buy coins.
// Do NOT put private keys or API secrets here.
export const PAYMENT = {
  // Your PayPal email or paypal.me link. Leave empty to hide the paypal option.
  paypalEmail: "randomswede1@gmail.com",            // TODO: real
  paypalMeLink: "https://paypal.me/alejdigallubja",// TODO: real or ""

  // Your USDC wallet address on Base. Leave empty to hide the crypto option.
  usdcBaseAddress: "0x937958680bbff48d4686bfbafd41350bff44b765", // TODO: real

  // Minimum buy equivalent in USD (both methods).
  minimumPurchaseUsd: 5,

  // How long you usually take to credit coins after payment.
  creditEtaText: "usually within a few minutes",

  // Your support / billing email (same as legal contact is fine).
  contactEmail: "randomswede1@gmail.com",
};

// How many coins the user gets per dollar. Adjust to taste.
// Gifts currently cost 5/10/20 coins for heart/fire/star.
export const COINS_PER_USD = 100;
