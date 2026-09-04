"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./Explore.module.css";
import {
  TbSearch,
  TbAdjustmentsHorizontal,
  TbMapPin,
  TbBolt,
  TbStar,
  TbX,
  TbChevronDown,
} from "react-icons/tb";

const TURFS = [
  { id: 1, name: "SkyDome Indoor Arena", area: "Westlands", county: "Nairobi", category: "Indoor", surface: "Artificial Turf", price: 3000, floodlit: true, rating: 4.9, reviews: 112, slotsToday: 2, amenities: ["Floodlights", "Parking", "Changing Rooms", "Showers", "Water Point", "Equipment Rental"] },
  { id: 2, name: "Number Ten Turf", area: "Kilimani", county: "Nairobi", category: "7-a-side", surface: "Artificial Turf", price: 2500, floodlit: true, rating: 4.8, reviews: 203, slotsToday: 4, amenities: ["Floodlights", "Parking", "Changing Rooms", "Spectator Seating", "Water Point"] },
  { id: 3, name: "Parklands 5s Arena", area: "Parklands", county: "Nairobi", category: "5-a-side", surface: "Artificial Turf", price: 1800, floodlit: true, rating: 4.6, reviews: 89, slotsToday: 6, amenities: ["Floodlights", "Parking", "Water Point"] },
  { id: 4, name: "Buruburu Complex", area: "Buruburu", county: "Nairobi", category: "11-a-side", surface: "Natural Grass", price: 4000, floodlit: false, rating: 4.5, reviews: 64, slotsToday: 1, amenities: ["Parking", "Spectator Seating", "First Aid"] },
  { id: 5, name: "Kasarani Sports Ground", area: "Kasarani", county: "Nairobi", category: "11-a-side", surface: "Hybrid Turf", price: 3500, floodlit: true, rating: 4.7, reviews: 158, slotsToday: 3, amenities: ["Floodlights", "Parking", "Changing Rooms", "Spectator Seating", "First Aid", "Referee on Request"] },
  { id: 6, name: "Embakasi Turf City", area: "Embakasi", county: "Nairobi", category: "7-a-side", surface: "Artificial Turf", price: 2200, floodlit: true, rating: 4.4, reviews: 71, slotsToday: 5, amenities: ["Floodlights", "Parking", "Water Point", "Equipment Rental"] },
  { id: 7, name: "Nyali Beach Pitch", area: "Nyali", county: "Mombasa", category: "5-a-side", surface: "Natural Grass", price: 2000, floodlit: false, rating: 4.6, reviews: 97, slotsToday: 3, amenities: ["Parking", "Water Point"] },
  { id: 8, name: "Bamburi Sports Park", area: "Bamburi", county: "Mombasa", category: "7-a-side", surface: "Artificial Turf", price: 2400, floodlit: true, rating: 4.5, reviews: 82, slotsToday: 2, amenities: ["Floodlights", "Parking", "Changing Rooms", "Water Point"] },
  { id: 9, name: "Milimani Turf", area: "Milimani", county: "Kisumu", category: "7-a-side", surface: "Artificial Turf", price: 2100, floodlit: true, rating: 4.3, reviews: 45, slotsToday: 4, amenities: ["Floodlights", "Parking", "Showers"] },
  { id: 10, name: "Kondele 5s", area: "Kondele", county: "Kisumu", category: "5-a-side", surface: "Artificial Turf", price: 1500, floodlit: false, rating: 4.2, reviews: 38, slotsToday: 7, amenities: ["Parking", "Water Point"] },
  { id: 11, name: "Racecourse Grounds", area: "Nakuru Town", county: "Nakuru", category: "11-a-side", surface: "Natural Grass", price: 3200, floodlit: true, rating: 4.6, reviews: 76, slotsToday: 2, amenities: ["Floodlights", "Parking", "Spectator Seating", "First Aid"] },
  { id: 12, name: "Eldoret Sports Club", area: "Eldoret Town", county: "Uasin Gishu", category: "7-a-side", surface: "Hybrid Turf", price: 2300, floodlit: true, rating: 4.7, reviews: 69, slotsToday: 3, amenities: ["Floodlights", "Parking", "Changing Rooms", "Referee on Request"] },
  { id: 13, name: "Thika Greens Arena", area: "Thika", county: "Kiambu", category: "5-a-side", surface: "Artificial Turf", price: 1700, floodlit: true, rating: 4.4, reviews: 54, slotsToday: 5, amenities: ["Floodlights", "Parking", "Water Point"] },
  { id: 14, name: "Ruiru Turf Point", area: "Ruiru", county: "Kiambu", category: "7-a-side", surface: "Natural Grass", price: 2000, floodlit: false, rating: 4.3, reviews: 41, slotsToday: 6, amenities: ["Parking", "Changing Rooms"] },
  { id: 15, name: "Kitengela Sports Ground", area: "Kitengela", county: "Kajiado", category: "11-a-side", surface: "Artificial Turf", price: 3000, floodlit: true, rating: 4.5, reviews: 58, slotsToday: 2, amenities: ["Floodlights", "Parking", "Spectator Seating", "Equipment Rental"] },
];

const KENYA_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir",
  "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos",
  "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
  "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia",
  "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
  "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi",
];

const CATEGORIES = ["Indoor", "5-a-side", "7-a-side", "11-a-side"];
const SURFACES = ["Artificial Turf", "Natural Grass", "Hybrid Turf"];
const AMENITIES = [
  "Floodlights", "Parking", "Changing Rooms", "Showers", "Spectator Seating",
  "Water Point", "First Aid", "Equipment Rental", "Referee on Request",
];
const RATING_OPTIONS = [
  { label: "Any rating", value: 0 },
  { label: "4.0 & up", value: 4.0 },
  { label: "4.5 & up", value: 4.5 },
  { label: "4.8 & up", value: 4.8 },
];
const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating_desc" },
  { label: "Most Available Today", value: "slots_desc" },
];

const PRICE_MIN = 1000;
const PRICE_MAX = 4500;

export default function Explore() {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX]);
  const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");

  const [selectedCounties, setSelectedCounties] = useState([]);
  const [countyPanelOpen, setCountyPanelOpen] = useState(false);
  const [countyQuery, setCountyQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleFromList = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const filteredCountyOptions = useMemo(() => {
    const q = countyQuery.trim().toLowerCase();
    if (!q) return KENYA_COUNTIES;
    return KENYA_COUNTIES.filter((c) => c.toLowerCase().includes(q));
  }, [countyQuery]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSurfaces([]);
    setSelectedAmenities([]);
    setMinRating(0);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setAvailableTodayOnly(false);
    setSortBy("recommended");
    setSelectedCounties([]);
    setCountyQuery("");
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedSurfaces.length +
    selectedAmenities.length +
    selectedCounties.length +
    (minRating > 0 ? 1 : 0) +
    (availableTodayOnly ? 1 : 0) +
    (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0);

  const filteredTurfs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = TURFS.filter((t) => {
      if (q && !`${t.name} ${t.area} ${t.county}`.toLowerCase().includes(q)) return false;
      if (selectedCategories.length && !selectedCategories.includes(t.category)) return false;
      if (selectedSurfaces.length && !selectedSurfaces.includes(t.surface)) return false;
      if (selectedCounties.length && !selectedCounties.includes(t.county)) return false;
      if (selectedAmenities.length && !selectedAmenities.every((a) => t.amenities.includes(a))) return false;
      if (t.rating < minRating) return false;
      if (t.price < priceRange[0] || t.price > priceRange[1]) return false;
      if (availableTodayOnly && t.slotsToday <= 0) return false;
      return true;
    });

    switch (sortBy) {
      case "price_asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating_desc":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case "slots_desc":
        result = [...result].sort((a, b) => b.slotsToday - a.slotsToday);
        break;
      default:
        break;
    }
    return result;
  }, [query, selectedCategories, selectedSurfaces, selectedCounties, selectedAmenities, minRating, priceRange, availableTodayOnly, sortBy]);

  const pricePct = (val) => ((val - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <section className={`section_hero ${styles.page}`}>
      <div className={`container ${styles.inner}`}>
        {/* ── Title row */}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Available Turfs</h1>

          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <TbSearch className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search turfs, towns..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <button
              type="button"
              className={`${styles.filtersBtn} ${filtersOpen ? styles.filtersBtnActive : ""}`}
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
              aria-controls="turf-filters-drawer"
            >
              <TbAdjustmentsHorizontal aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span className={styles.filterCount}>{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Grid */}
        {filteredTurfs.length > 0 ? (
          <div className={styles.grid}>
            {filteredTurfs.map((turf) => (
              <article key={turf.id} className={styles.card}>
                <div className={styles.thumb}>
                  <span className={styles.sizeBadge}>{turf.category}</span>
                  {turf.floodlit && (
                    <span className={styles.floodlitBadge} aria-label="Floodlit">
                      <TbBolt aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardName}>{turf.name}</h3>
                  <p className={styles.cardLocation}>
                    <TbMapPin className={styles.pinIcon} aria-hidden="true" />
                    {turf.area}, {turf.county}
                  </p>

                  <div className={styles.priceRow}>
                    <span className={styles.price}>KSh {turf.price.toLocaleString()}</span>
                    <span className={styles.pricePeriod}>/ hour</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.rating}>
                      <TbStar className={styles.starIcon} aria-hidden="true" />
                      {turf.rating}
                      <span className={styles.reviews}>({turf.reviews})</span>
                    </span>
                    <span className={styles.slots}>
                      <span className={styles.slotsDot} aria-hidden="true" />
                      {turf.slotsToday} slots today
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No turfs match those filters</p>
            <p className={styles.emptyText}>
              Try a different county, widen the price range, or clear filters to see everything.
            </p>
            <button type="button" className={styles.clearBtn} onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Filters drawer */}
      <div
        className={`${styles.drawerOverlay} ${filtersOpen ? styles.drawerOverlayOpen : ""}`}
        onClick={() => setFiltersOpen(false)}
        aria-hidden="true"
      />
      <div
        id="turf-filters-drawer"
        className={`${styles.drawer} ${filtersOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="turf-filters-heading"
      >
        <div className={styles.drawerHeader}>
          <h2 id="turf-filters-heading" className={styles.drawerTitle}>Filters</h2>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          >
            <TbX aria-hidden="true" />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {/* Sort */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionLabel}>Sort by</span>
            <div className={styles.selectWrap}>
              <select
                className={styles.nativeSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <TbChevronDown className={styles.selectChevron} aria-hidden="true" />
            </div>
          </div>

          {/* County */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionLabel}>Location</span>
            <button
              type="button"
              className={styles.selectTrigger}
              onClick={() => setCountyPanelOpen((v) => !v)}
              aria-expanded={countyPanelOpen}
            >
              <span>
                {selectedCounties.length === 0
                  ? "All counties"
                  : selectedCounties.length === 1
                  ? selectedCounties[0]
                  : `${selectedCounties.length} counties selected`}
              </span>
              <TbChevronDown
                className={`${styles.selectChevron} ${countyPanelOpen ? styles.selectChevronOpen : ""}`}
                aria-hidden="true"
              />
            </button>

            {countyPanelOpen && (
              <div className={styles.countyPanel}>
                <div className={styles.countySearchBox}>
                  <TbSearch className={styles.countySearchIcon} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search counties..."
                    value={countyQuery}
                    onChange={(e) => setCountyQuery(e.target.value)}
                    className={styles.countySearchInput}
                  />
                </div>
                <div className={styles.countyList}>
                  {filteredCountyOptions.map((county) => (
                    <label key={county} className={styles.countyOption}>
                      <input
                        type="checkbox"
                        checked={selectedCounties.includes(county)}
                        onChange={() => toggleFromList(selectedCounties, setSelectedCounties, county)}
                      />
                      {county}
                    </label>
                  ))}
                  {filteredCountyOptions.length === 0 && (
                    <p className={styles.countyNoMatch}>No counties match &ldquo;{countyQuery}&rdquo;</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pitch size */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionLabel}>Pitch size</span>
            <div className={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.chip} ${selectedCategories.includes(cat) ? styles.chipActive : ""}`}
                  onClick={() => toggleFromList(selectedCategories, setSelectedCategories, cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Surface */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionLabel}>Surface type</span>
            <div className={styles.chipRow}>
              {SURFACES.map((surface) => (
                <button
                  key={surface}
                  type="button"
                  className={`${styles.chip} ${selectedSurfaces.includes(surface) ? styles.chipActive : ""}`}
                  onClick={() => toggleFromList(selectedSurfaces, setSelectedSurfaces, surface)}
                >
                  {surface}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className={styles.drawerSection}>
            <div className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel}>Price per hour</span>
              <span className={styles.priceValue}>
                KSh {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()}
              </span>
            </div>
            <div className={styles.rangeSlider}>
              <div className={styles.rangeTrack}>
                <div
                  className={styles.rangeTrackActive}
                  style={{
                    left: `${pricePct(priceRange[0])}%`,
                    right: `${100 - pricePct(priceRange[1])}%`,
                  }}
                />
              </div>
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={100}
                value={priceRange[0]}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), priceRange[1] - 100);
                  setPriceRange([val, priceRange[1]]);
                }}
                className={styles.rangeInput}
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={100}
                value={priceRange[1]}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), priceRange[0] + 100);
                  setPriceRange([priceRange[0], val]);
                }}
                className={styles.rangeInput}
              />
            </div>
          </div>

          {/* Minimum rating */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionLabel}>Minimum rating</span>
            <div className={styles.chipRow}>
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.chip} ${minRating === opt.value ? styles.chipActive : ""}`}
                  onClick={() => setMinRating(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className={styles.drawerSection}>
            <span className={styles.sectionLabel}>Amenities</span>
            <div className={styles.chipRow}>
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  className={`${styles.chip} ${selectedAmenities.includes(amenity) ? styles.chipActive : ""}`}
                  onClick={() => toggleFromList(selectedAmenities, setSelectedAmenities, amenity)}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className={`${styles.drawerSection} ${styles.switchSection}`}>
            <div>
              <span className={styles.sectionLabel}>Available today</span>
              <p className={styles.switchHint}>Only show turfs with open slots today</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={availableTodayOnly}
              className={`${styles.switch} ${availableTodayOnly ? styles.switchOn : ""}`}
              onClick={() => setAvailableTodayOnly((v) => !v)}
            >
              <span className={styles.switchThumb} />
            </button>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button type="button" className={styles.clearBtn} onClick={clearFilters}>
            Clear all
          </button>
          <button
            type="button"
            className={styles.applyBtn}
            onClick={() => setFiltersOpen(false)}
          >
            Show {filteredTurfs.length} turf{filteredTurfs.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </section>
  );
}