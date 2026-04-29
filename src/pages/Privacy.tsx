import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LAST_UPDATED = "April 29, 2026";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

          <p className="mb-6">
            Muslim Professionals Network ("we", "us", "our") operates{" "}
            <a href="https://www.muslimprosnet.com">www.muslimprosnet.com</a> (the "Service"). This
            Privacy Policy explains what information we collect, how we use it, who we share it
            with, and the choices you have. By using the Service you agree to this policy.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-2"><strong>Information you provide:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account details: name, email address, password (stored hashed by our auth provider).</li>
              <li>Account type: visitor, professional, or business.</li>
              <li>Profile information: occupation, industry, biography, location, profile photo, social media links.</li>
              <li>Business profile information (for business accounts): business name, description, location, website, contact details, logo and images, social links.</li>
              <li>Messages you send through the in-app messaging system.</li>
              <li>Mentorship requests and responses.</li>
              <li>Reports you file about other users or messages.</li>
              <li>Contact-form and feedback submissions.</li>
              <li>Donations: when you donate via PayPal, PayPal processes the payment; we do not receive or store your card details.</li>
            </ul>
            <p className="mb-2"><strong>Information collected automatically:</strong></p>
            <ul className="list-disc pl-6 mb-4">
              <li>Profile-view events (which signed-in users have viewed your profile).</li>
              <li>Sign-up and authentication events.</li>
              <li>Basic device and browser information for security and debugging.</li>
              <li>Cookies and similar technologies required to keep you signed in.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Operate, maintain, and improve the Service.</li>
              <li>Authenticate you and keep your account secure.</li>
              <li>Display your profile to other signed-in members in directory results.</li>
              <li>Deliver messages, mentorship requests, and notifications.</li>
              <li>Enforce our Terms, investigate abuse reports, and protect users.</li>
              <li>Respond to inquiries you submit via the contact or feedback forms.</li>
              <li>Send transactional emails (verification, password reset, important account notices).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Automated Image Moderation</h2>
            <p className="mb-4">
              Profile photos and business images you upload are automatically screened by a
              third-party AI moderation service (OpenAI) to detect inappropriate content.
              Images that fail moderation may be rejected or removed. Image URLs (not personal
              identifiers) are sent to the moderation provider for this purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. How We Share Information</h2>
            <p className="mb-4">
              We do not sell your personal information. We share information only as described
              below:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>With other members:</strong> profile information is visible to other signed-in members in directory results and on your public profile. Directory results are not visible to unauthenticated visitors.</li>
              <li><strong>Service providers (data processors):</strong>
                <ul className="list-[circle] pl-6 mt-1">
                  <li>Supabase — database, authentication, storage, edge functions (hosted in the United States).</li>
                  <li>Resend — transactional and notification email delivery.</li>
                  <li>OpenAI — automated image moderation.</li>
                  <li>PayPal — donation processing.</li>
                  <li>Lovable — application hosting and deployment.</li>
                  <li>Sentry — error monitoring (when enabled).</li>
                </ul>
              </li>
              <li><strong>Legal and safety:</strong> when required by law, valid legal process, or to protect the rights, safety, or property of our users or the Service.</li>
              <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets, subject to standard confidentiality protections.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. International Data Transfers</h2>
            <p className="mb-4">
              The Service is operated from, and data is processed in, the United States. If you
              access the Service from outside the U.S., your information will be transferred to
              and processed in the U.S., which may have data-protection laws different from
              those in your country.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Account and profile data: retained while your account is active.</li>
              <li>Messages: retained until you or your counterpart delete the conversation, or your account is deleted.</li>
              <li>Abuse reports: retained for moderation, audit, and legal purposes.</li>
              <li>Authentication logs and security events: retained for a limited period for fraud and abuse prevention.</li>
              <li>When you delete your account, your profile and personally identifying data are removed; some records (e.g., abuse reports, audit logs) may be retained as required by law or legitimate business interest.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
            <p className="mb-4">
              We use industry-standard safeguards including TLS for data in transit, hashed
              passwords, row-level security policies in our database, server-side enforcement of
              messaging and role rules, and restricted edge-function CORS allowlists. No method
              of transmission or storage is 100% secure, but we work continuously to protect
              your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Your Choices and Rights</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access &amp; update:</strong> view and edit your profile from the Edit Profile / Edit Business Profile pages.</li>
              <li><strong>Block users:</strong> block any member from their profile or from professional cards; manage blocked users in Settings → Privacy.</li>
              <li><strong>Messaging privacy:</strong> control who can message you in Settings → Privacy.</li>
              <li><strong>Delete your account:</strong> permanently delete your account and personal data from Settings → Delete Account.</li>
              <li><strong>Report content:</strong> report fake profiles or abusive messages directly from the affected profile or message.</li>
              <li>Depending on your jurisdiction (e.g., GDPR, CCPA), you may have additional rights, including the right to request a copy of your data, restrict processing, or lodge a complaint with a supervisory authority. Contact us to exercise these rights.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="mb-4">
              The Service is intended for users aged 16 and older. We do not knowingly collect
              personal information from children under 16. If you believe a child has provided
              us with personal information, contact us and we will delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Cookies and Similar Technologies</h2>
            <p className="mb-4">
              We use cookies and browser storage to keep you signed in, remember your
              preferences, and secure the Service. You can control cookies through your browser
              settings; disabling them may break sign-in and other core functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Material changes will be
              announced on this page with an updated "Last updated" date. Continued use of the
              Service after changes take effect constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="mb-4">
              Questions, concerns, or data-rights requests:
            </p>
            <p className="mb-4">
              Email: contact@muslimprosnet.com<br />
              Address: Portland, Oregon, USA
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
