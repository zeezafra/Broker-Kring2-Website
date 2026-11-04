import Broker from "@/components/Broker";
import Chapter from "@/components/Chapter";
import FeaturedProperties from "@/components/FeaturedProperties";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { InquiryProvider } from "@/components/InquiryModal";

export default function Home() {
  return (
    <InquiryProvider>
      <Header />
      <main>
        <Hero />
        <FeaturedProperties />
        <Chapter />
        <Broker />
      </main>
      <Footer />
    </InquiryProvider>
  );
}
