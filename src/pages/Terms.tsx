import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LAST_UPDATED = "April 29, 2026";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Muslim Professionals Network ("the Service",
              www.muslimprosnet.com), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree, do not use the Service. These Terms are governed by the laws
              of the State of Oregon, United States.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Muslim Professionals Network is a professional networking platform that connects
              Muslim professionals, businesses, and individuals seeking professional services
              within the Muslim community. Features include member directories, business
              listings, in-app messaging, mentorship requests, favorites, and reporting tools.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
            <p className="mb-4">
              You must be at least 16 years old to create an account. By registering, you
              represent that you meet this age requirement and that the information you provide
              is accurate and complete.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
            <p className="mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Providing accurate, current, and complete information.</li>
              <li>Updating your information to keep it current.</li>
              <li>Notifying us immediately of any unauthorized use of your account.</li>
            </ul>
            <p className="mb-4">
              Your account type (visitor, professional, or business) is set at signup and
              determines what you can do on the platform. Business accounts may create and
              manage business profiles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Business Accounts and Listings</h2>
            <p className="mb-4">
              If you operate a business profile, you represent that you have authority to act
              on behalf of that business and that all information provided (name, description,
              location, contact details, images) is accurate. You are responsible for keeping
              the listing current. We may remove or suspend listings that appear inaccurate,
              misleading, or in violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe on intellectual property or privacy rights.</li>
              <li>Post or transmit harmful, fraudulent, deceptive, hateful, harassing, sexually explicit, or otherwise inappropriate content.</li>
              <li>Impersonate any person or business or misrepresent your affiliation.</li>
              <li>Send spam, unsolicited bulk messages, or recruitment messages outside the platform's intended use.</li>
              <li>Scrape, crawl, or harvest data from the Service.</li>
              <li>Attempt to gain unauthorized access to accounts, systems, or data.</li>
              <li>Interfere with or disrupt the Service or its security mechanisms.</li>
              <li>Use the Service for unauthorized commercial purposes.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Messaging Conduct</h2>
            <p className="mb-4">
              In-app messaging is provided to facilitate respectful professional communication.
              Abusive, harassing, threatening, or spam messages are prohibited. Users may report
              messages or block other users; reported content is reviewed by our moderation team
              and may result in account suspension or termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Content and Intellectual Property</h2>
            <p className="mb-4">
              You retain ownership of content you post on the Service. By posting content, you
              grant us a non-exclusive, worldwide, royalty-free license to host, display,
              reproduce, and distribute your content as necessary to operate and promote the
              Service. You represent that you have all rights necessary to grant this license.
            </p>
            <p className="mb-4">
              All trademarks, logos, and platform content owned by Muslim Professionals Network
              remain our property. You may not use our branding without prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Image Moderation</h2>
            <p className="mb-4">
              Images you upload (profile photos, business images) are automatically screened by
              an AI moderation service. Images that fail moderation may be rejected or removed.
              Repeated attempts to upload prohibited content may result in account suspension.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Mentorship Program</h2>
            <p className="mb-4">
              The mentorship features are provided as a connection tool only. We do not vet,
              endorse, or guarantee any mentor or mentee, and we are not a party to any
              mentorship relationship formed through the Service. Participants are solely
              responsible for their interactions and any advice exchanged.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. No Professional Advice</h2>
            <p className="mb-4">
              Information shared on the Service by other users — including by professionals or
              businesses — is provided for informational purposes only and does not constitute
              legal, medical, financial, or other professional advice. You should obtain
              independent professional advice before acting on anything you read on the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Donations</h2>
            <p className="mb-4">
              Donations made through our "Support Our Mission" page are processed by PayPal and
              are voluntary, non-refundable, and not tax-deductible unless expressly stated. We
              do not receive your payment-card details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>,
              which also governs your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Disclaimers and Limitation of Liability</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL
              BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT ANY MEMBER, BUSINESS, OR CONTENT
              IS ACCURATELY REPRESENTED.
            </p>
            <p className="mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, MUSLIM PROFESSIONALS NETWORK SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify and hold Muslim Professionals Network, its officers,
              employees, and affiliates harmless from any claims, damages, liabilities, losses,
              and expenses (including reasonable legal fees) arising from your use of the
              Service, your content, or your violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Termination</h2>
            <p className="mb-4">
              We may suspend or terminate your account and access to the Service at our sole
              discretion, with or without notice, for conduct that we believe violates these
              Terms, harms other users, or exposes us to legal risk. You may delete your
              account at any time from Settings → Delete Account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. DMCA / Copyright Takedown</h2>
            <p className="mb-4">
              If you believe content on the Service infringes your copyright, send a written
              notice to <strong>contact@muslimprosnet.com</strong> including: a description of
              the copyrighted work, the URL of the allegedly infringing material, your contact
              information, a good-faith statement that the use is not authorized, and a
              statement under penalty of perjury that the information is accurate and that you
              are authorized to act on behalf of the rights holder.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms are governed by the laws of the State of Oregon, without regard to
              its conflict-of-law provisions. Any disputes shall be resolved exclusively in the
              state or federal courts located in Oregon, and you consent to the personal
              jurisdiction of such courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">19. Changes to Terms</h2>
            <p className="mb-4">
              We may modify these Terms at any time. Material changes will be posted on this
              page with an updated "Last updated" date. Continued use of the Service after the
              changes take effect constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">20. Contact Information</h2>
            <p className="mb-4">
              Questions about these Terms:
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

export default Terms;
