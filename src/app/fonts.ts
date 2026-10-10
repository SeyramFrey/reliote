import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

// Polices partagées par le layout localisé et les pages qui le remplacent
// (global-not-found, global-error doivent fournir leur propre <html>).

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: ["normal", "italic"],
});

export const fontVariables = `${geist.variable} ${geistMono.variable} ${instrument.variable}`;
