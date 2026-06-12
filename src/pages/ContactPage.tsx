import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";

export function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitContactForm({ name, email, phone, subject, message });
      toast("Message sent successfully! We will respond within 24-48 business hours.", "success");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      toast(err.message || "Failed to send message. Please try again later.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 relative mx-auto max-w-5xl px-4 py-16 z-10 w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent -z-10" />

        <h1 className="text-4xl font-black tracking-tight text-center mb-2">Contact Us</h1>
        <p className="text-slate-400 text-sm text-center mb-12">
          We're here to help with questions about our tools, plans, or trading methodology.
        </p>

        <div className="grid gap-8 lg:grid-cols-5 text-left items-start">
          {/* Left Panel: Contact Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
              <h2 className="text-lg font-bold text-violet-300 border-b border-white/5 pb-3">
                OUR CONTACT DETAILS
              </h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Email</span>
                  <a href="mailto:arbaz90salman@gmail.com" className="text-white hover:text-violet-400 font-mono break-all">
                    arbaz90salman@gmail.com
                  </a>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Phone / WhatsApp</span>
                  <span className="text-white font-mono">+92 309 9716270</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Business Address</span>
                  <span className="text-white">Rawalpindi,Pakistan</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Business Hours</span>
                  <span className="text-white">Monday – Friday, 9:00 AM – 6:00 PM (Local Time)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Send us a Message */}
          <div className="lg:col-span-3 space-y-6">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 space-y-6">
              <h2 className="text-lg font-bold text-violet-300 border-b border-white/5 pb-3">
                SEND US A MESSAGE
              </h2>
              <p className="text-slate-400 text-xs">
                Please fill in the form below and our team will respond within 24–48 business hours.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Muhammad Ali" 
                    required 
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="e.g. your@email.com" 
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Phone Number (Optional)</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="e.g. +92 300 0000000" 
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl bg-[#0b1120] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/50"
                    required
                  >
                    <option value="">Select one...</option>
                    <option value="subscription">Subscription & Billing</option>
                    <option value="technical">Technical Support</option>
                    <option value="accuracy">Signal Accuracy Inquiry</option>
                    <option value="partnership">Partnership</option>
                    <option value="privacy">Privacy / Data Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Message</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  rows={5}
                  className="w-full rounded-xl bg-[#0b1120] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 resize-none placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Form Risk Disclaimer Box */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4 text-xs text-red-400/90 leading-relaxed">
                <p className="font-bold text-red-400 mb-1">⚠️ RISK DISCLAIMER:</p>
                GannPro 9 does not provide personalized financial advice. Our support team can assist with platform-related questions only. For investment decisions, please consult a qualified financial advisor licensed in your jurisdiction.
              </div>

              <Button type="submit" disabled={submitting} className="w-full text-base py-3">
                {submitting ? "Sending Message..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-16 text-center text-[11px] text-slate-500 border-t border-white/5 pt-8">
          GannPro9 &nbsp;|&nbsp; <span className="font-mono">ganntradingsignal.cloud</span> &nbsp;|&nbsp; Trading involves risk. Not financial advice.
        </div>
      </main>
    </div>
  );
}
