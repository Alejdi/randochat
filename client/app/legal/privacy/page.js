import { LEGAL } from "@/lib/legal-info";

export const metadata = { title: "Privacy Policy — RandoChat" };

export default function Privacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <div className="meta">Effective: {LEGAL.effectiveDate}</div>

      <p>
        This Privacy Policy describes how {LEGAL.businessName} (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, uses, and shares information about you when you use
        {" "}{LEGAL.siteName} (the &ldquo;Service&rdquo;). We take privacy seriously and collect
        only the data we need to run the Service.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Device identifier</strong>: a random UUID generated in your browser and
          stored in localStorage. It persists across sessions so we can keep track of your coin
          balance and gift history. Clearing your browser storage deletes it and cannot be
          recovered.
        </li>
        <li>
          <strong>Display username</strong>: a name you choose. You can change it at any time.
          Usernames may be shown to other users during a session and appear in our moderation
          tools.
        </li>
        <li>
          <strong>IP address and approximate country</strong>: collected by our infrastructure
          providers (Cloudflare, Vercel). We use the country for country-based matching and the
          IP for moderation (ban enforcement and abuse detection).
        </li>
        <li>
          <strong>Usage events</strong>: session start, session end, matches, skips, reports,
          blocks, gift transactions, approximate session duration. Used for product analytics
          and abuse detection.
        </li>
        <li>
          <strong>Reports</strong>: if another user reports you, we record the time, the
          reporter&rsquo;s session identifier, your IP at the time, and the report reason.
        </li>
        <li>
          <strong>Coin and gift history</strong>: each coin purchase, gift sent, and gift
          received is recorded in our ledger for accounting and audit purposes.
        </li>
      </ul>

      <h2>2. What we do NOT collect</h2>
      <ul>
        <li>
          We do not record or store your <strong>video or audio</strong>. Calls are
          peer-to-peer and end-to-end encrypted via WebRTC/DTLS-SRTP; we never see the media.
        </li>
        <li>
          We do not store <strong>chat message content</strong>. Text messages travel over the
          same peer-to-peer data channel and are ephemeral.
        </li>
        <li>
          We do not collect your real name, email, phone number, address, or government ID
          (unless you voluntarily provide them through a support or cashout flow).
        </li>
        <li>We do not use third-party advertising trackers.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <ul>
        <li>to match you with other users;</li>
        <li>to enforce community rules, bans, and abuse prevention;</li>
        <li>to maintain your coin balance and process gift transactions;</li>
        <li>to analyze usage and improve the Service;</li>
        <li>to comply with legal obligations.</li>
      </ul>

      <h2>4. Who we share information with</h2>
      <ul>
        <li>
          <strong>Infrastructure providers</strong> who process data on our behalf: Vercel
          (hosting), Cloudflare (CDN / tunnel), Supabase (database), Metered / OpenRelay (TURN
          relay for WebRTC). Each of these providers has their own privacy policies.
        </li>
        <li>
          <strong>Law enforcement</strong>, if legally required. We will not volunteer user data
          without a valid legal order.
        </li>
      </ul>
      <p>We do not sell your personal data to anyone.</p>

      <h2>5. International transfers</h2>
      <p>
        Some of our infrastructure providers operate servers outside your country. By using the
        Service you consent to your data being transferred to and processed in jurisdictions
        outside your own. We rely on our providers&rsquo; compliance programs (Standard
        Contractual Clauses and equivalent mechanisms) to protect the data in transit.
      </p>

      <h2>6. Data retention</h2>
      <ul>
        <li>Session and event data: up to 180 days.</li>
        <li>Reports and bans: retained indefinitely for moderation purposes.</li>
        <li>Coin balance and ledger entries: retained as long as your account is active.</li>
        <li>
          Inactive users (no activity for 12 months) will be purged along with their ledger
          history unless retention is required by law.
        </li>
      </ul>

      <h2>7. Your rights under GDPR</h2>
      <p>
        If you are in the European Economic Area, the United Kingdom, or a jurisdiction with
        comparable laws, you have the right to:
      </p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>request correction or deletion of your personal data;</li>
        <li>object to or restrict certain processing;</li>
        <li>receive a copy of your data in a portable format;</li>
        <li>withdraw consent at any time;</li>
        <li>lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>8. Cookies and local storage</h2>
      <p>
        We do not set tracking cookies. We use{" "}
        <code>localStorage</code> to store your device identifier, chosen username, country
        filter, dismissed prompts, and similar preferences. Administrators of the Service use a
        single HTTP-only cookie for authentication to the admin panel.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not directed to children under {LEGAL.ageMinimum}. We do not knowingly
        collect personal information from children under {LEGAL.ageMinimum}. If you believe a
        minor has provided us with personal data, please contact us and we will delete it.
      </p>

      <h2>10. Security</h2>
      <p>
        We use industry-standard measures to protect your data: HTTPS/TLS for all transport,
        encrypted databases, secure credentials management. However, no method of transmission
        over the internet is 100% secure and we cannot guarantee absolute security.
      </p>

      <h2>11. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. We will indicate the &ldquo;Effective&rdquo;
        date at the top. Continued use of the Service after changes constitutes acceptance of
        the updated Policy.
      </p>

      <h2>12. Contact</h2>
      <p>
        For privacy questions or to exercise your rights, email{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </>
  );
}
