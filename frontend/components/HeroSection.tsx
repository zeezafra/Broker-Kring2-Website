import { Suspense } from "react";
import { getLocations } from "@/lib/public-api";
import Hero from "./Hero";

async function HeroWithLocations() {
  return <Hero locations={await getLocations()} />;
}

// Phase 8: fetches the Location options on the server. The fallback is the same hero with no city options,
// so nothing jumps while the API answers (or if it is asleep on Render's free tier).
export default function HeroSection() {
  return (
    <Suspense fallback={<Hero locations={[]} />}>
      <HeroWithLocations />
    </Suspense>
  );
}
