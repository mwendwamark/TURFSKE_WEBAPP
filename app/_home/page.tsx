import React from "react";
import HomeHero from "./HomeHero/HomeHero";
import HomeAbout from "./HomeAbout/HomeAbout.jsx";
import Navbar from "@/components/navbar/Navbar";

const page = () => {
  return (
    <div>
      <Navbar variant="primary"/>
      <HomeHero />
      <HomeAbout />
    </div>
  );
};

export default page;
