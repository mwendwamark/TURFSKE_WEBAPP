import React from "react";
import HomeHero from "./HomeHero/HomeHero";
import HomeAbout from "./HomeAbout/HomeAbout.jsx";
import Navbar from "@/components/navbar/Navbar";
import HomeRoles from "./HomeRoles/HomeRoles.jsx";

const page = () => {
  return (
    <div>
      <Navbar variant="primary"/>
      <HomeHero />
      <HomeAbout />
      <HomeRoles />
    </div>
  );
};

export default page;
