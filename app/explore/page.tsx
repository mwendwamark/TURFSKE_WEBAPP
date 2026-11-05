import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import Explore from "./Explore";
import { getExploreData } from "./data";

export const metadata: Metadata = {
  title: "Browse Football Turfs in Kenya",
  description:
    "Browse and compare football turfs across Kenya. Filter by location, pitch size, surface type, and price. Find available slots near you on TurfsKE.",
  openGraph: {
    title: "Browse Football Turfs in Kenya | TurfsKE",
    description:
      "Browse and compare football turfs across Kenya. Filter by location, pitch size, surface type, and price.",
  },
};

export default async function ExplorePage() {
  const { venues, amenities } = await getExploreData();

  return (
    <main>
      <Navbar variant="secondary" />
      <Explore venues={venues} amenities={amenities} />
    </main>
  );
}
