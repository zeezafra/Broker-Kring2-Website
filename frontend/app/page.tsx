import type { Metadata } from "next";
import Broker from "@/components/Broker";
import BrokerJsonLd from "@/components/BrokerJsonLd";
import Chapter from "@/components/Chapter";
import FeaturedProperties from "@/components/FeaturedProperties";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { InquiryProvider } from "@/components/InquiryModal";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <InquiryProvider>
      <Header />
      <main id="main">
        <HeroSection />
        <FeaturedProperties />
        <Chapter />
        <Broker />
      </main>
      <Footer />
      <BrokerJsonLd />
    </InquiryProvider>
  );
}
