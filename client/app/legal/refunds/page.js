import { LEGAL } from "@/lib/legal-info";

export const metadata = { title: "Refund Policy — RandoChat" };

export default function Refunds() {
  return (
    <>
      <h1>Refund Policy</h1>
      <div className="meta">Effective: {LEGAL.effectiveDate}</div>

      <p>
        This Refund Policy explains when and how {LEGAL.businessName} (&ldquo;we&rdquo;)
        may refund purchases made on {LEGAL.siteName} (the &ldquo;Service&rdquo;). Please read
        carefully before buying coins.
      </p>

      <h2>1. What you&rsquo;re buying</h2>
      <p>
        When you &ldquo;buy coins&rdquo; on {LEGAL.siteName} you are purchasing a digital
        virtual item that is delivered to you instantly and consumed within the Service. Coins
        themselves have <strong>no monetary value outside the Service</strong> and cannot be
        exchanged for cash, goods, or services outside the Service unless we explicitly offer a
        cashout program.
      </p>

      <h2>2. General rule: purchases are final</h2>
      <p>
        Because digital goods are delivered immediately on payment, <strong>all coin purchases
        are final and non-refundable</strong> as a general rule. This is consistent with
        industry practice for virtual currencies.
      </p>

      <h2>3. EU consumer right to withdraw</h2>
      <p>
        If you are a consumer in the European Union, under Directive 2011/83/EU you have a
        14-day right to withdraw from a distance contract. However, this right does not apply
        to the supply of digital content when performance has begun with your prior express
        consent and your acknowledgement that your right of withdrawal will be lost once the
        content is delivered. By clicking the &ldquo;buy&rdquo; button, you{" "}
        <strong>expressly request immediate performance</strong> and{" "}
        <strong>acknowledge that you lose your right of withdrawal</strong> as soon as the
        coins are credited to your balance.
      </p>

      <h2>4. Exceptions — when we will refund</h2>
      <p>We will issue a refund in the following situations:</p>
      <ul>
        <li>
          <strong>Duplicate charge</strong>: you were charged more than once for the same coin
          package.
        </li>
        <li>
          <strong>Failed delivery</strong>: you were charged but the coins were never credited
          to your balance due to a technical failure on our side.
        </li>
        <li>
          <strong>Fraudulent transaction</strong>: someone made an unauthorized purchase using
          your payment method without your consent and you report it promptly.
        </li>
        <li>
          <strong>Service unavailability</strong>: a significant and prolonged outage prevented
          you from using coins you purchased. We assess these case-by-case.
        </li>
      </ul>

      <h2>5. Situations where we will NOT refund</h2>
      <ul>
        <li>
          Coins you have already spent on gifts — those coins have been delivered to another
          user and the transaction is complete.
        </li>
        <li>
          Accounts suspended or banned for violating our{" "}
          <a href="/legal/terms">Terms of Service</a>. Remaining balance is forfeited.
        </li>
        <li>
          Buyer&rsquo;s remorse, accidental purchases, or dissatisfaction with the experience.
        </li>
        <li>
          Chargebacks initiated without first contacting our support team. Chargeback abuse
          results in an immediate permanent ban.
        </li>
      </ul>

      <h2>6. How to request a refund</h2>
      <p>
        Email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> within{" "}
        <strong>7 days</strong> of the charge with:
      </p>
      <ul>
        <li>your username;</li>
        <li>the date and amount of the charge;</li>
        <li>the reason for the refund request;</li>
        <li>any relevant transaction IDs or screenshots.</li>
      </ul>
      <p>
        We aim to respond within 5 business days. Approved refunds are returned to the original
        payment method and may take 5–10 business days to appear on your statement depending on
        your bank or card issuer.
      </p>

      <h2>7. Cashout program (if offered)</h2>
      <p>
        If we offer a cashout program for users to redeem earned coins for real-world value,
        that program has its own terms, including identity verification, minimum balances, tax
        reporting, hold periods, and anti-fraud rules. Amounts cashed out through the program
        are not governed by this Refund Policy.
      </p>

      <h2>8. Changes to this Policy</h2>
      <p>
        We may update this Refund Policy from time to time. The updated policy applies to all
        purchases made after its effective date.
      </p>

      <h2>9. Contact</h2>
      <p>
        Refund requests and questions:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </>
  );
}
