import React from "react";

// 📁 Logo files chahiye: /public/logos/ folder mein yeh exact names se daalen:
//   jazzcash.png
//   easypaisa.png
//   nayapay.png
//   sadapay.png
//   meezan.png
//   hbl.png
//   ubl.png

const AppLogo = ({ name, file }: { name: string; file: string }) => (
  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center">
    <img
      src={`/logos/${file}`}
      alt={name}
      className="w-full h-full object-contain"
    />
  </div>
);

export const PAYMENT_APPS = [
  {
    id: "jazzcash",
    name: "JazzCash",
    color: "#ED1C24",
    deepLink: (amount: number) =>
      `jazzcash://sendmoney?msisdn=03099716270&amount=${amount}`,
    playStore: "https://play.google.com/store/apps/details?id=com.techlogix.mobilinkcustomer",
    logo: <AppLogo name="JazzCash" file="lg-691c164eec616-JazzCash.webp" />,
  },
  {
    id: "easypaisa",
    name: "EasyPaisa",
    color: "#00A651",
    deepLink: (amount: number) =>
      `easypaisa://sendmoney?msisdn=03099716270&amount=${amount}`,
    playStore: "https://play.google.com/store/apps/details?id=com.telenor.pakistan.mytelenor",
    logo: <AppLogo name="EasyPaisa" file="lg-691c1186e198d-easypaisa.webp" />,
  },
  {
    id: "nayapay",
    name: "NayaPay",
    color: "#5B2FC9",
    deepLink: (amount: number) =>
      `nayapay://pay?to=03099716270&amount=${amount}`,
    playStore: "https://play.google.com/store/apps/details?id=com.nayapay.app",
    logo: <AppLogo name="NayaPay" file="vecteezy_nayapay-logo-symbol-mark-img-illustration_74690247.png" />,
  },
  {
    id: "sadapay",
    name: "SadaPay",
    color: "#E8453C",
    deepLink: (amount: number) =>
      `sadapay://pay?to=03099716270&amount=${amount}`,
    playStore: "https://play.google.com/store/apps/details?id=com.sadapay.app",
    logo: <AppLogo name="SadaPay" file="Sadapay-Logo-1024x1024.png" />,
  },
  {
    id: "meezan",
    name: "Meezan Bank",
    color: "#006837",
    deepLink: null,
    playStore: "https://play.google.com/store/apps/details?id=com.ofss.fcdb.mobile.android",
    iban: true,
    logo: <AppLogo name="Meezan Bank" file="lg-67a9cfc4acfce-Meezan-Bank.webp" />,
  },
  {
    id: "hbl",
    name: "HBL Mobile",
    color: "#006838",
    deepLink: null,
    playStore: "https://play.google.com/store/apps/details?id=com.hbl.android.hblmobilebanking",
    iban: true,
    logo: <AppLogo name="HBL Mobile" file="lg-67add30a53db4-HBL-Bank-Habib.webp" />,
  },
  {
    id: "ubl",
    name: "UBL Digital",
    color: "#003087",
    deepLink: null,
    playStore: "https://play.google.com/store/apps/details?id=com.ubl.omni",
    iban: true,
    logo: <AppLogo name="UBL Digital" file="ubl.png" />,
  },
] as const;

export const PLAN_AMOUNTS: Record<string, number> = {
  basic: 27800,
  standard: 83400,
  pro: 139000,
};
