"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Circle, LayoutGrid, Wallet } from "lucide-react";
import Button from "@/components/ui/buttons/Button";
import RoleNoticeBanner from "@/components/auth/RoleNoticeBanner";
import VenueForm from "./VenueForm";
import PitchForm from "./PitchForm";
import type { Amenity, Pitch, PayoutStatus, VenueWithRelations } from "./types";
import styles from "./Overview.module.css";

type ModalState =
  | { type: "venue"; venue: VenueWithRelations | null }
  | { type: "pitch"; venue: VenueWithRelations; pitch: Pitch | null }
  | null;

type ManagerOverviewProps = {
  venues: VenueWithRelations[];
  amenities: Amenity[];
  payout: PayoutStatus;
  fullName: string;
  roleNotice?: string;
};

export default function ManagerOverview({
  venues,
  amenities,
  payout,
  fullName,
  roleNotice,
}: ManagerOverviewProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);

  const venuesCount = venues.length;
  const pitchesCount = venues.reduce((sum, venue) => sum + venue.pitches.length, 0);
  const payoutActive = payout.paystackSubaccountCode != null;

  const checklistItems = [
    { label: "Create your account", done: true },
    { label: "Add your first venue", done: venuesCount > 0 },
    { label: "Add your first pitch", done: pitchesCount > 0 },
    { label: "Set up payouts", done: payoutActive },
  ];
  const allDone = checklistItems.every((item) => item.done);

  const pitchQuickSub =
    venues.length === 0
      ? "Add a venue first"
      : venues.length === 1
        ? "Create a pitch to start taking bookings"
        : "Pick a venue to add it to";

  function closeModal() {
    setModal(null);
  }

  function handleSaved() {
    setModal(null);
    router.refresh();
  }

  function openAddPitch() {
    if (venues.length === 0) return;
    if (venues.length === 1) {
      setModal({ type: "pitch", venue: venues[0], pitch: null });
      return;
    }
    router.push("/dashboard/venues");
  }

  return (
    <>
      <div className={styles.overview}>
        {roleNotice && <RoleNoticeBanner notice={roleNotice} />}

        <div className={styles.page_head}>
          <div>
            <h2 className={styles.page_title}>Welcome, {fullName}</h2>
            <p className={styles.page_sub}>
              Manage your venues, pitches and payouts from here.
            </p>
          </div>
          <Button href="/dashboard/venues">Manage venues</Button>
        </div>

        {/* Stat row */}
        <div className={styles.stat_row}>
          <div className={styles.stat_card_accent}>
            <span className={styles.stat_icon_accent} aria-hidden="true">
              <Building2 size={20} />
            </span>
            <span className={styles.stat_value_accent}>{venuesCount}</span>
            <span className={styles.stat_label_accent}>
              {venuesCount === 1 ? "Venue" : "Venues"}
            </span>
          </div>

          <div className={styles.stat_card}>
            <span className={styles.stat_icon} aria-hidden="true">
              <LayoutGrid size={20} />
            </span>
            <span className={styles.stat_value}>{pitchesCount}</span>
            <span className={styles.stat_label}>
              {pitchesCount === 1 ? "Pitch" : "Pitches"}
            </span>
          </div>

          <Link
            href="/dashboard/payouts"
            className={`${styles.stat_card} ${styles.stat_card_link}`}
          >
            <span className={styles.stat_icon} aria-hidden="true">
              <Wallet size={20} />
            </span>
            <span className={styles.stat_status}>
              <span
                className={`${styles.status_dot} ${
                  payoutActive ? styles.status_dot_active : styles.status_dot_pending
                }`}
                aria-hidden="true"
              />
              {payoutActive ? "Active" : "Not set up"}
            </span>
            <span className={styles.stat_label}>Payout status</span>
          </Link>
        </div>

        {/* Quick actions */}
        <div className={styles.section_head}>
          <h3 className={styles.section_title}>Quick actions</h3>
        </div>
        <div className={styles.quick_actions}>
          <button
            type="button"
            className={styles.quick_action}
            onClick={() => setModal({ type: "venue", venue: null })}
          >
            <span className={styles.quick_icon} aria-hidden="true">
              <Building2 size={18} />
            </span>
            <span className={styles.quick_text}>
              <span className={styles.quick_title}>Add a venue</span>
              <span className={styles.quick_sub}>List your turf so players can find it</span>
            </span>
          </button>

          <button
            type="button"
            className={styles.quick_action}
            onClick={openAddPitch}
            disabled={venues.length === 0}
            title={venues.length === 0 ? "Add a venue first" : undefined}
          >
            <span className={styles.quick_icon} aria-hidden="true">
              <LayoutGrid size={18} />
            </span>
            <span className={styles.quick_text}>
              <span className={styles.quick_title}>Add a pitch</span>
              <span className={styles.quick_sub}>{pitchQuickSub}</span>
            </span>
          </button>

          {!payoutActive && (
            <Link href="/dashboard/payouts" className={styles.quick_action}>
              <span className={styles.quick_icon} aria-hidden="true">
                <Wallet size={18} />
              </span>
              <span className={styles.quick_text}>
                <span className={styles.quick_title}>Set up payouts</span>
                <span className={styles.quick_sub}>Receive money from player bookings</span>
              </span>
            </Link>
          )}
        </div>

        {/* Getting-started checklist + recent venues */}
        <div className={styles.lower_grid}>
          {!allDone && (
            <div className={styles.checklist_card}>
              <h3 className={styles.checklist_title}>Getting started</h3>
              <ul className={styles.checklist_list}>
                {checklistItems.map((item) => (
                  <li
                    key={item.label}
                    className={`${styles.checklist_item} ${
                      item.done ? styles.checklist_item_done : styles.checklist_item_pending
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2
                        size={20}
                        className={styles.check_icon}
                        fill="var(--primary_green)"
                        stroke="#ffffff"
                      />
                    ) : (
                      <Circle
                        size={20}
                        className={styles.check_icon_pending}
                        strokeWidth={1.8}
                      />
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.recent_block}>
            <div className={styles.section_head}>
              <h3 className={styles.section_title}>
                {venuesCount === 0 ? "Your venues" : "Recent venues"}
              </h3>
              <Link href="/dashboard/venues" className={styles.view_all}>
                View all
              </Link>
            </div>
            <div className={styles.recent_list}>
              {venues.length === 0 ? (
                <p className={styles.empty_list}>
                  No venues yet — add your first venue to get started.
                </p>
              ) : (
                venues.map((venue) => (
                  <div key={venue.id} className={styles.recent_row}>
                    <span className={styles.recent_icon} aria-hidden="true">
                      <Building2 size={18} />
                    </span>
                    <div className={styles.recent_info}>
                      <p className={styles.recent_name}>{venue.name}</p>
                      {venue.address_text && (
                        <p className={styles.recent_address}>{venue.address_text}</p>
                      )}
                    </div>
                    <span className={styles.pitch_pill}>
                      {venue.pitches.length === 0
                        ? "No pitches"
                        : venue.pitches.length === 1
                          ? "1 pitch"
                          : `${venue.pitches.length} pitches`}
                    </span>
                    <Link href="/dashboard/venues" className={styles.recent_manage}>
                      Manage →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" && modal?.type === "venue"
        ? createPortal(
            <VenueForm
              amenities={amenities}
              venue={modal.venue}
              onClose={closeModal}
              onSaved={handleSaved}
            />,
            document.body,
          )
        : null}
      {typeof document !== "undefined" && modal?.type === "pitch"
        ? createPortal(
            <PitchForm
              venueId={modal.venue.id}
              pitch={modal.pitch}
              onClose={closeModal}
              onSaved={handleSaved}
            />,
            document.body,
          )
        : null}
    </>
  );
}