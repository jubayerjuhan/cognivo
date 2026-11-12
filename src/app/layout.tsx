import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { SwRegister } from "@/components/SwRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cognivo",
  description: "AI-powered knowledge workspace for students and researchers",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("cognivo-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <SwRegister />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
