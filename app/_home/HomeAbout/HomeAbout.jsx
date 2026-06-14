import React from "react";
import styles from "./HomeAbout.module.css";
import SmallHeader from "@/components/ui/smallHeader/SmallHeader";
import Button from "@/components/ui/buttons/Button";

const HomeAbout = () => {
  return (
    <section className={`section ${styles.about} ${styles.container}`}>
      <div className={`${styles.h_about_container} container`}>
        <header className={`section_header ${styles.h_about_header}`}>
          <SmallHeader text="What is TurfsKe?" />
          <h1
            className={` max_width_80 section_title ${styles.h_about_large_header}`}
          >
            Kenya&apos;s number one platform for finding turfs around you
          </h1>
        </header>

        <div className={`max_width_80 ${styles.h_about_right_contents}`}>
          <p className={styles.h_about_text}>
            Turfske is a sports ground booking platform that allows users to
            find and book turfs around them. It is a one-stop-shop for all your
            turf booking needs.
          </p>
          <div className={styles.h_about_buttons}>
            <Button href="/explore" variant="outline">Explore Turfs</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeAbout;
