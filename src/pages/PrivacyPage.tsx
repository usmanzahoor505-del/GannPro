import { Navbar } from "@/components/layout/Navbar";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 relative mx-auto max-w-3xl px-4 py-16 z-10 w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent -z-10" />

        <h1 className="text-4xl font-black tracking-tight text-center mb-2">PRIVACY POLICY</h1>
        <p className="text-slate-400 text-xs text-center mb-8 uppercase tracking-wider">
          Effective Date: June 12, 2025 &nbsp;|&nbsp; Last Updated: June 12, 2025
        </p>

        {/* Risk Disclaimer Box */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 mb-8 text-amber-300/90 text-sm leading-relaxed">
          <p className="font-bold text-amber-400 flex items-center gap-2 mb-2">
            <span>⚠️</span> RISK DISCLAIMER:
          </p>
          Trading in financial markets involves substantial risk of loss and is not suitable for all investors. 
          Past performance, including any accuracy figures, is not indicative of future results. 
          GannPro 9 provides educational and analytical tools only — nothing on this platform constitutes financial, 
          investment, or trading advice.
        </div>

        {/* Content Box */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-8 text-slate-300 leading-relaxed text-sm">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">01</span> INTRODUCTION
            </h2>
            <p>
              GannPro 9 ("we", "our", or "us") operates the website <span className="text-violet-300 font-mono">ganntradingsignal.cloud</span>. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. 
              By using our platform, you agree to the terms described below. If you do not agree with this policy, please discontinue use of our website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">02</span> INFORMATION WE COLLECT
            </h2>
            <p className="mb-2">We may collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
              <li>
                <strong className="text-slate-300">Personal Identification Information</strong> — Name, email address, phone number, or other details you voluntarily provide through forms or account registration.
              </li>
              <li>
                <strong className="text-slate-300">Usage Data</strong> — Pages visited, time spent on pages, browser type, IP address, referring URLs, and device information collected automatically.
              </li>
              <li>
                <strong className="text-slate-300">Payment Information</strong> — If you subscribe to a paid plan, payment is processed by a third-party payment provider. We do not store full card details on our servers.
              </li>
              <li>
                <strong className="text-slate-300">Cookies & Tracking Data</strong> — Small files placed on your device to improve functionality, remember preferences, and analyze site traffic.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">03</span> HOW WE USE YOUR INFORMATION
            </h2>
            <p className="mb-2">We use the information collected to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Process transactions and send related notices</li>
              <li>Send you updates, alerts, and marketing communications (with your consent)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve and personalize your experience on our platform</li>
              <li>Monitor usage patterns and analyze traffic for performance improvements</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">04</span> COOKIES
            </h2>
            <p>Our website uses cookies to enhance user experience. Types of cookies we use:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li><strong className="text-slate-300">Essential Cookies</strong> — Required for the website to function properly.</li>
              <li><strong className="text-slate-300">Analytics Cookies</strong> — Help us understand how visitors interact with our site (e.g., Google Analytics).</li>
              <li><strong className="text-slate-300">Preference Cookies</strong> — Remember your settings and choices.</li>
            </ul>
            <p className="mt-2 text-slate-400">
              You may disable cookies through your browser settings. Doing so may affect the functionality of certain parts of our website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">05</span> SHARING OF INFORMATION
            </h2>
            <p className="mb-2">We do not sell, trade, or rent your personal information to third parties. We may share data with:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
              <li>
                <strong className="text-slate-300">Service Providers</strong> — Trusted third parties who assist in operating our website (e.g., hosting, analytics, payment processing) under strict confidentiality agreements.
              </li>
              <li>
                <strong className="text-slate-300">Legal Authorities</strong> — When required by law, court order, or government regulation.
              </li>
              <li>
                <strong className="text-slate-300">Business Transfers</strong> — In the event of a merger, acquisition, or sale of company assets, user data may be transferred as part of that transaction.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">06</span> DATA RETENTION
            </h2>
            <p>
              We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy, or as required by applicable law. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">07</span> DATA SECURITY
            </h2>
            <p>
              We implement industry-standard security measures to protect your information, including SSL encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">08</span> THIRD-PARTY LINKS
            </h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policy of any third-party site you visit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">09</span> CHILDREN'S PRIVACY
            </h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a child has provided us personal data, we will delete it promptly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">10</span> YOUR RIGHTS
            </h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400 font-normal">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Withdraw consent for marketing communications at any time</li>
              <li>Lodge a complaint with a relevant data protection authority</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at the details listed in the Contact section.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex gap-2">
              <span className="text-violet-400 font-mono">11</span> CHANGES TO THIS POLICY
            </h2>
            <p>
              We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with a revised effective date. Continued use of our website after changes constitutes your acceptance of the updated policy.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
