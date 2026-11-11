import Hero from "./Hero";

// The Location panel loads its own cities from the browser, so there is nothing to fetch on the server any more.
export default function HeroSection() {
  return <Hero />;
}
