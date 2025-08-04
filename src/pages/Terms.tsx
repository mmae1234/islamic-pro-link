import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Muslim Pros ("the Service"), you accept and agree to be bound by 
              the terms and provision of this agreement. These Terms of Service are governed by the 
              laws of the State of Oregon, United States.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Muslim Pros is a professional networking platform that connects Muslim professionals, 
              entrepreneurs, and individuals seeking professional services within the Muslim community.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Updating your information to keep it current</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Engage in harassment, discrimination, or hate speech</li>
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Use the Service for any commercial purpose without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Content and Intellectual Property</h2>
            <p className="mb-4">
              You retain ownership of content you post on the Service. By posting content, you grant 
              us a non-exclusive, worldwide, royalty-free license to use, display, and distribute 
              your content on the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which also governs 
              your use of the Service, to understand our practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimers and Limitation of Liability</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT 
              PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.
            </p>
            <p className="mb-4">
              IN NO EVENT SHALL MUSLIM PROS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify and hold Muslim Pros harmless from any claims, damages, or 
              expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Service at our sole discretion, 
              without prior notice, for conduct that we believe violates these Terms or is harmful to 
              other users or the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the 
              State of Oregon, without regard to its conflict of law provisions.
            </p>
            <p className="mb-4">
              Any disputes arising out of or relating to these Terms or the Service shall be resolved 
              exclusively in the state or federal courts located in Oregon, and you consent to the 
              personal jurisdiction of such courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any 
              material changes by posting the updated Terms on our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-4">
              Email: legal@muslimpros.com<br />
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