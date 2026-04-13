import { LEGAL } from "@/lib/legal-info";

export const metadata = { title: "Terms of Service — RandoChat" };

export default function Terms() {
  return (
    <>
      <h1>Terms of Service</h1>
      <div className="meta">Effective: {LEGAL.effectiveDate}</div>

      <p>
        Welcome to {LEGAL.siteName}. These Terms of Service (&ldquo;Terms&rdquo;) govern your access
        to and use of {LEGAL.siteName} (the &ldquo;Service&rdquo;), operated by {LEGAL.businessName}
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By using the Service you agree to
        these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Age requirement</h2>
      <p>
        You must be at least <strong>{LEGAL.ageMinimum} years old</strong> to use the Service.
        By using the Service you represent that you are of legal age and that you are not barred
        from using it under the laws of your jurisdiction. If we learn that a user is under
        {" "}{LEGAL.ageMinimum}, we will terminate their access immediately.
      </p>

      <h2>2. What RandoChat is</h2>
      <p>
        {LEGAL.siteName} is a random peer-to-peer video chat service. We match you with another
        user for a live video and text conversation. Video and audio streams flow directly
        between your browser and the other user&rsquo;s browser using WebRTC; we do not record,
        store, or transcribe your calls. Text messages are sent over the same peer connection
        and are not retained server-side.
      </p>

      <h2>3. Accounts and identity</h2>
      <p>
        We do not require traditional accounts. We assign you a persistent device identifier
        stored locally in your browser and you choose a display username. Clearing your browser
        storage resets your identity and your coin balance.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>send, display, or solicit sexual content, nudity, or sexual acts;</li>
        <li>harass, threaten, stalk, dox, defame, or discriminate against anyone;</li>
        <li>share content involving minors in any form;</li>
        <li>share violent or graphic content, self-harm content, or content glorifying harm to others;</li>
        <li>impersonate another person or misrepresent your affiliation;</li>
        <li>share personal information of others without their consent;</li>
        <li>transmit malware, viruses, or malicious links;</li>
        <li>use the Service to break any law applicable to you;</li>
        <li>automate interactions (bots, scrapers) or abuse the matchmaking queue;</li>
        <li>circumvent bans, rate limits, content filters, or country restrictions;</li>
        <li>use the Service to advertise, solicit, or promote unrelated goods or services;</li>
        <li>attempt to compromise the security of the Service or other users.</li>
      </ul>

      <h2>5. Moderation and enforcement</h2>
      <p>
        We reserve the right to suspend, ban, or terminate any user at any time, with or without
        notice, at our sole discretion. Other users can report you; three valid reports within
        a short window result in an automatic permanent IP ban. Bans are enforced by IP address.
        You may appeal a ban by emailing{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>

      <h2>6. Virtual coins and gifts</h2>
      <p>
        The Service includes virtual items called &ldquo;coins&rdquo; that you can purchase and
        use to send &ldquo;gifts&rdquo; to other users during a call. <strong>Coins are
        virtual goods with no monetary value outside the Service.</strong> Coins are
        non-transferable, non-refundable (except as described in our Refund Policy), and may not
        be exchanged for cash, goods, or services outside the Service unless we explicitly
        authorize it through a cashout program we operate. When you send a gift, 70% of the
        coin value is credited to the recipient&rsquo;s in-app balance and 30% is retained by
        {" "}{LEGAL.businessName} as a platform fee.
      </p>
      <p>
        If a cashout program is offered, additional terms (including identity verification, tax
        reporting, and minimum thresholds) will apply and will be presented to you before you
        can participate.
      </p>

      <h2>7. User content</h2>
      <p>
        You retain all rights in the content you transmit over the Service. You grant us a
        limited license to relay that content to the user you are matched with for the duration
        of a session. We do not claim ownership of your content and we do not store your
        live video, audio, or text messages.
      </p>

      <h2>8. Disclaimer of warranties</h2>
      <p>
        The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
        without warranties of any kind, either express or implied. We do not warrant that the
        Service will be uninterrupted, secure, or free from errors. We do not control the
        behavior of other users and cannot guarantee the content you will encounter.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, {LEGAL.businessName} and its
        officers, directors, employees and agents shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising out of or relating to
        your use of the Service, even if we have been advised of the possibility of such damages.
        In no event shall our aggregate liability exceed the amount you paid us, if any, during
        the twelve (12) months immediately preceding the event giving rise to the claim.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate your access at
        any time, for any reason, with or without notice. All provisions of these Terms that by
        their nature should survive termination will survive.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes
        constitutes acceptance of the updated Terms. We will indicate the &ldquo;Effective&rdquo;
        date at the top of this document when changes are made.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by {LEGAL.governingLaw}, without regard to its conflict of laws
        provisions. Any dispute arising from or related to these Terms shall be subject to the
        exclusive jurisdiction of the courts of {LEGAL.jurisdiction}.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    </>
  );
}
