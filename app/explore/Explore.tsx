"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import styles from "./Explore.module.css";
import {
  TbSearch,
  TbAdjustmentsHorizontal,
  TbMapPin,
  TbBolt,
  TbX,
  TbChevronDown,
  TbNavigation,
} from "react-icons/tb";
import type { Amenity, VenueWithRelations } from "../dashboard/types";
import { pitchStartingPrice } from "@/utils/pricing";
// ── Types ──────────────────────────────────────────────────

type VenueCard = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImage: { id: string; storage_path: string; position: number } | null;
  lowestPrice: number | null;
  amenityNames: string[];
  sizes: string[];
  surfaces: string[];
  floodlit: boolean;
  activePitchCount: number;
};

// ── Helpers ────────────────────────────────────────────────

function venueToCard(venue: VenueWithRelations): VenueCard {
  const activePitches = venue.pitches.filter((p) => p.status === "active");
  const lowestPrice = activePitches.reduce<number | null>((min, p) => {
    const price = pitchStartingPrice(p);
    if (price == null) return min;
    return min === null || price < min ? price : min;
  }, null);
  const coverImage =
    [...venue.venue_images].sort((a, b) => a.position - b.position)[0] ?? null;
  const amenityNames = venue.venue_amenities
    .map((link) => link.amenities?.name)
    .filter((name): name is string => Boolean(name));
  const sizes = [
    ...new Set(
      activePitches.map((p) => p.size).filter((s): s is string => Boolean(s)),
    ),
  ];
  const surfaces = [
    ...new Set(
      activePitches
        .map((p) => p.surface_type)
        .filter((s): s is string => Boolean(s)),
    ),
  ];

  return {
    id: venue.id,
    name: venue.name,
    address: venue.address_text,
    latitude: venue.latitude,
    longitude: venue.longitude,
    coverImage,
    lowestPrice,
    amenityNames,
    sizes,
    surfaces,
    floodlit: amenityNames.includes("Floodlights"),
    activePitchCount: activePitches.length,
  };
}

type NearbyResult = {
  id: string;
  distance_km: number;
};

// ── Constants ──────────────────────────────────────────────

const PRICE_MIN = 500;
const PRICE_MAX = 10000;

const SORT_OPTIONS = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Nearest to me", value: "nearest" },
];

// ── Component ──────────────────────────────────────────────

export default function Explore({
  venues,
  amenities,
}: {
  venues: VenueWithRelations[];
  amenities: Amenity[];
}) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX]);
  const [sortBy, setSortBy] = useState("recommended");

  // Geolocation state
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "locating" | "granted" | "denied"
  >("idle");

  // PostGIS nearby venues state
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[] | null>(
    null,
  );
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Transform venues to card objects
  const cards = useMemo(() => venues.map(venueToCard), [venues]);

  // Derive available categories and surfaces from real data
  const availableCategories = useMemo(
    () => [...new Set(cards.flatMap((c) => c.sizes))].sort(),
    [cards],
  );
  const availableSurfaces = useMemo(
    () => [...new Set(cards.flatMap((c) => c.surfaces))].sort(),
    [cards],
  );
  const availableAmenities = useMemo(
    () => amenities.map((a) => a.name).sort(),
    [amenities],
  );

  // Derive price bounds from real data
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = cards
      .map((c) => c.lowestPrice)
      .filter((p): p is number => p != null);
    if (prices.length === 0)
      return { minPrice: PRICE_MIN, maxPrice: PRICE_MAX };
    return {
      minPrice: Math.floor(Math.min(...prices) / 100) * 100,
      maxPrice: Math.ceil(Math.max(...prices) / 100) * 100,
    };
  }, [cards]);

  // Clamp price range to valid bounds
  const clampedPriceRange = useMemo(
    (): [number, number] => [
      Math.max(minPrice, Math.min(priceRange[0], maxPrice)),
      Math.max(minPrice, Math.min(priceRange[1], maxPrice)),
    ],
    [priceRange, minPrice, maxPrice],
  );

  // Map venue ID → distance from PostGIS RPC
  const distanceMap = useMemo(() => {
    if (!nearbyResults) return null;
    return new Map(nearbyResults.map((r) => [r.id, r.distance_km]));
  }, [nearbyResults]);

  // ── Geolocation ──────────────────────────────────────────

  // Auto-request location when "nearest" sort is selected
  useEffect(() => {
    if (sortBy !== "nearest" || geoStatus !== "idle") return;

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      // Defer setState to avoid cascading renders
      setTimeout(() => setGeoStatus("denied"), 0);
      return;
    }

    setTimeout(() => setGeoStatus("locating"), 0);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [sortBy, geoStatus]);

  // Clear RPC results when sort changes away from "nearest"
  useEffect(() => {
    if (sortBy !== "nearest") {
      setTimeout(() => setNearbyResults(null), 0);
    }
  }, [sortBy]);

  // Fetch nearby venues from PostGIS when geolocation succeeds
  useEffect(() => {
    if (sortBy !== "nearest" || geoStatus !== "granted" || !userCoords) return;
    if (nearbyResults) return; // Already fetched

    setTimeout(() => setNearbyLoading(true), 0);
    const supabase = createClient();
    supabase
      .rpc("nearby_venues", { lat: userCoords.lat, lng: userCoords.lng })
      .then(({ data, error }) => {
        setNearbyLoading(false);
        if (error || !data) {
          setNearbyResults(null);
          return;
        }
        setNearbyResults(data as NearbyResult[]);
      });
  }, [sortBy, geoStatus, userCoords, nearbyResults]);

  // ── Filtering ────────────────────────────────────────────

  const toggleFromList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSurfaces([]);
    setSelectedAmenities([]);
    setPriceRange([minPrice, maxPrice]);
    setSortBy("recommended");
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedSurfaces.length +
    selectedAmenities.length +
    (clampedPriceRange[0] > minPrice || clampedPriceRange[1] < maxPrice
      ? 1
      : 0);

  const filteredTurfs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = cards.filter((card) => {
      if (q && !`${card.name} ${card.address ?? ""}`.toLowerCase().includes(q))
        return false;
      if (
        selectedCategories.length &&
        !card.sizes.some((s) => selectedCategories.includes(s))
      )
        return false;
      if (
        selectedSurfaces.length &&
        !card.surfaces.some((s) => selectedSurfaces.includes(s))
      )
        return false;
      if (
        selectedAmenities.length &&
        !selectedAmenities.every((a) => card.amenityNames.includes(a))
      )
        return false;
      if (
        card.lowestPrice != null &&
        (card.lowestPrice < clampedPriceRange[0] ||
          card.lowestPrice > clampedPriceRange[1])
      )
        return false;
      // Hide venues with no price when price filter is active
      if (card.lowestPrice == null && clampedPriceRange[0] > minPrice)
        return false;
      return true;
    });

    switch (sortBy) {
      case "price_asc":
        result = [...result].sort(
          (a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity),
        );
        break;
      case "price_desc":
        result = [...result].sort(
          (a, b) => (b.lowestPrice ?? -Infinity) - (a.lowestPrice ?? -Infinity),
        );
        break;
      case "nearest":
        if (nearbyResults) {
          // Use PostGIS RPC ordering — returns venues sorted by real distance
          const orderMap = new Map(nearbyResults.map((r, i) => [r.id, i]));
          result = [...result].sort((a, b) => {
            const orderA = orderMap.get(a.id) ?? Infinity;
            const orderB = orderMap.get(b.id) ?? Infinity;
            return orderA - orderB;
          });
        } else {
          // Fallback to alphabetical when RPC results are unavailable
          result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        }
        break;
      default:
        break;
    }
    return result;
  }, [
    cards,
    query,
    selectedCategories,
    selectedSurfaces,
    selectedAmenities,
    clampedPriceRange,
    sortBy,
    nearbyResults,
    minPrice,
  ]);

  const pricePct = (val: number) =>
    ((val - minPrice) / (maxPrice - minPrice)) * 100;

  // ── Render ───────────────────────────────────────────────

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
              <Link
                key={turf.id}
                href={`/venues/${turf.id}`}
                className={styles.card}
              >
                <div className={styles.thumb}>
                  {turf.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/venue-media/${turf.coverImage.storage_path.split("/").map(encodeURIComponent).join("/")}`}
                      alt={turf.name}
                      className={styles.thumbImage}
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder}>
                      <TbMapPin size={32} aria-hidden="true" />
                    </div>
                  )}
                  {turf.sizes.length > 0 && (
                    <span className={styles.sizeBadge}>{turf.sizes[0]}</span>
                  )}
                  {turf.floodlit && (
                    <span
                      className={styles.floodlitBadge}
                      aria-label="Floodlit"
                    >
                      <TbBolt aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardName}>{turf.name}</h3>
                  {turf.address && (
                    <p className={styles.cardLocation}>
                      <TbMapPin className={styles.pinIcon} aria-hidden="true" />
                      {turf.address}
                    </p>
                  )}

                  {turf.lowestPrice != null && (
                    <div className={styles.priceRow}>
                      <span className={styles.pricePeriod}>From</span>
                      <span className={styles.price}>
                        KSh {turf.lowestPrice.toLocaleString()}
                      </span>
                      <span className={styles.pricePeriod}>/ hour</span>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.pitchCount}>
                      {turf.activePitchCount} pitch
                      {turf.activePitchCount !== 1 ? "es" : ""}
                    </span>
                    {sortBy === "nearest" &&
                      distanceMap?.get(turf.id) != null && (
                        <span className={styles.distance}>
                          <TbNavigation
                            className={styles.distanceIcon}
                            aria-hidden="true"
                          />
                          {distanceMap!.get(turf.id)!.toFixed(1)} km away
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              {cards.length === 0
                ? "No turfs listed yet"
                : "No turfs match those filters"}
            </p>
            <p className={styles.emptyText}>
              {cards.length === 0
                ? "Turf managers haven't added their venues yet. Check back soon."
                : "Try a different search, widen the price range, or clear filters to see everything."}
            </p>
            {cards.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
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
          <h2 id="turf-filters-heading" className={styles.drawerTitle}>
            Filters
          </h2>
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
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <TbChevronDown
                className={styles.selectChevron}
                aria-hidden="true"
              />
            </div>
            {sortBy === "nearest" && geoStatus === "denied" && (
              <p className={styles.geoHint}>
                Location unavailable — showing alphabetical order. Enable
                location access for distance sorting.
              </p>
            )}
            {sortBy === "nearest" && geoStatus === "locating" && (
              <p className={styles.geoHint}>Getting your location…</p>
            )}
            {sortBy === "nearest" &&
              geoStatus === "granted" &&
              nearbyLoading && (
                <p className={styles.geoHint}>Finding nearby turfs…</p>
              )}
          </div>

          {/* Pitch size */}
          {availableCategories.length > 0 && (
            <div className={styles.drawerSection}>
              <span className={styles.sectionLabel}>Pitch size</span>
              <div className={styles.chipRow}>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.chip} ${selectedCategories.includes(cat) ? styles.chipActive : ""}`}
                    onClick={() =>
                      toggleFromList(
                        selectedCategories,
                        setSelectedCategories,
                        cat,
                      )
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surface */}
          {availableSurfaces.length > 0 && (
            <div className={styles.drawerSection}>
              <span className={styles.sectionLabel}>Surface type</span>
              <div className={styles.chipRow}>
                {availableSurfaces.map((surface) => (
                  <button
                    key={surface}
                    type="button"
                    className={`${styles.chip} ${selectedSurfaces.includes(surface) ? styles.chipActive : ""}`}
                    onClick={() =>
                      toggleFromList(
                        selectedSurfaces,
                        setSelectedSurfaces,
                        surface,
                      )
                    }
                  >
                    {surface}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price range */}
          <div className={styles.drawerSection}>
            <div className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel}>Price per hour</span>
              <span className={styles.priceValue}>
                KSh {priceRange[0].toLocaleString()} –{" "}
                {priceRange[1].toLocaleString()}
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
                min={minPrice}
                max={maxPrice}
                step={100}
                value={priceRange[0]}
                onChange={(e) => {
                  const val = Math.min(
                    Number(e.target.value),
                    priceRange[1] - 100,
                  );
                  setPriceRange([val, priceRange[1]]);
                }}
                className={styles.rangeInput}
              />
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step={100}
                value={priceRange[1]}
                onChange={(e) => {
                  const val = Math.max(
                    Number(e.target.value),
                    priceRange[0] + 100,
                  );
                  setPriceRange([priceRange[0], val]);
                }}
                className={styles.rangeInput}
              />
            </div>
          </div>

          {/* Amenities */}
          {availableAmenities.length > 0 && (
            <div className={styles.drawerSection}>
              <span className={styles.sectionLabel}>Amenities</span>
              <div className={styles.chipRow}>
                {availableAmenities.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className={`${styles.chip} ${selectedAmenities.includes(amenity) ? styles.chipActive : ""}`}
                    onClick={() =>
                      toggleFromList(
                        selectedAmenities,
                        setSelectedAmenities,
                        amenity,
                      )
                    }
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearFilters}
          >
            Clear all
          </button>
          <button
            type="button"
            className={styles.applyBtn}
            onClick={() => setFiltersOpen(false)}
          >
            Show {filteredTurfs.length} turf
            {filteredTurfs.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </section>
  );
}
