import React from "react";
import Button from "@/components/ui/buttons/Button";
import Navbar from "@/components/navbar/Navbar";
import HomeHero from "@/app/_home/HomeHero/HomeHero";
const page = () => {
  return (
    <main>
      <Navbar variant="primary"/>
      <HomeHero />
    </main>
  );
};

export default page;
