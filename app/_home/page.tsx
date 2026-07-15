import React from "react";
import dynamic from "next/dynamic";
import HomeHero from "./HomeHero/HomeHero";
import Navbar from "@/components/navbar/Navbar";

const HomeAbout = dynamic(() => import("./HomeAbout/HomeAbout.jsx"));
const HomeRoles = dynamic(() => import("./HomeRoles/HomeRoles.jsx"));
const HomeSolutions = dynamic(() => import("./HomeSolutions/HomeSolutions.jsx"));
const HomeTestimonial = dynamic(() => import("./HomeTestimonials/HomeTestimonial"));

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
