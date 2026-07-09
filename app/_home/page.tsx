import React from "react";
import HomeHero from "./HomeHero/HomeHero";
import HomeAbout from "./HomeAbout/HomeAbout.jsx";
import Navbar from "@/components/navbar/Navbar";
import HomeRoles from "./HomeRoles/HomeRoles.jsx";
import HomeSolutions from "./HomeSolutions/HomeSolutions.jsx";
import HomeTestimonial from "./HomeTestimonials/HomeTestimonial";
const page = () => {
  return (
    <div>
      <Navbar variant="primary" />
      <HomeHero />
      <HomeAbout />
      <HomeRoles />
      <HomeSolutions />
      <HomeTestimonial/>
    </div>
  );
};

export default page;
