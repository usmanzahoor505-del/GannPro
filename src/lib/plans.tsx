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
] as const;

export const PLAN_AMOUNTS: Record<string, number> = {
  basic: 27800,
  standard: 83400,
  pro: 139000,
};
