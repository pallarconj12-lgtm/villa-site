import { framePath } from "./frames";

/**
 * Everything editable about the villa lives here: name, copy, numbers, gallery
 * selection, nearby places. Photography is referenced by frame number, so swapping
 * files in /public/frames swaps the images everywhere.
 */

export const site = {
  name: "Perry’s Ville",
  tagline: "Where luxury meets tranquility.",
  location: "Your destination, Country", // <-- shown in the Location section
  email: "reservations@example.com", // <-- replace
  year: new Date().getFullYear(),
};

export const NAV = [
  { label: "Home", href: "#home" },
  { label: "The Villa", href: "#villa" },
  { label: "Experience", href: "#experience" },
  { label: "Gallery", href: "#gallery" },
  { label: "Location", href: "#location" },
  { label: "Book Now", href: "#book" },
] as const;

export const img = (frame: number) => framePath(frame, "desktop");

/* ------------------------------ Villa ------------------------------ */

export const SPECS = [
  { value: "4", label: "Bedrooms" },
  { value: "4", label: "Bathrooms" },
  { value: "8", label: "Guests" },
] as const;

export const AMENITIES = [
  { name: "Private Infinity Pool", note: "Lit from within after dark, shared with no one" },
  { name: "Fully Equipped Kitchen", note: "An island long enough for the whole table" },
  { name: "Outdoor Lounge", note: "Loungers and shade along the water" },
  { name: "Wi-Fi", note: "Throughout the house and terrace" },
  { name: "Private Parking", note: "On the property" },
] as const;

/* ---------------------------- Experience --------------------------- */

export const EXPERIENCES = [
  {
    title: "Morning Light",
    copy: "Floor-to-ceiling glass draws the day in slowly. The travertine warms underfoot and the room brightens before you have thought about coffee.",
    frame: 23,
    layout: "right",
  },
  {
    title: "Private Pool",
    copy: "A long, still pool runs the length of the courtyard. Swim at first light, or at dusk when the water turns the colour of the sky.",
    frame: 32,
    layout: "left",
  },
  {
    title: "Indoor-Outdoor Living",
    copy: "Sliding walls of glass disappear into the stone. Living room, terrace and garden read as one continuous space.",
    frame: 14,
    layout: "wide",
  },
  {
    title: "Sunset Dining",
    copy: "Pendant lights come on as the sky turns rose. The table faces the water, and nobody is in a hurry to leave it.",
    frame: 17,
    layout: "right",
  },
  {
    title: "Peace & Privacy",
    copy: "Ringed by palms and set well back from the road. The only sounds are wind in the fronds and water finding its level.",
    frame: 5,
    layout: "wide",
  },
] as const;

/* ------------------------------ Gallery ---------------------------- */
/**
 * A 12-column mosaic on desktop (col / row are CSS grid lines), two columns on
 * phones and tablets. `wide` = spans both mobile columns. `pos` = object-position.
 */
type GalleryItem = {
  frame: number;
  label: string;
  col: string;
  row: string;
  wide?: boolean;
  pos?: string;
};

export const GALLERY: readonly GalleryItem[] = [
  { frame: 1, label: "Aerial approach", col: "1 / span 7", row: "1 / span 4", wide: true },
  { frame: 6, label: "The facade at dusk", col: "8 / span 5", row: "1 / span 3" },
  { frame: 11, label: "Through the front doors", col: "8 / span 5", row: "4 / span 3" },
  { frame: 13, label: "Living room", col: "1 / span 3", row: "5 / span 2" },
  { frame: 15, label: "Kitchen", col: "4 / span 4", row: "5 / span 2" },
  { frame: 19, label: "The long corridor", col: "1 / span 4", row: "7 / span 6", wide: true },
  { frame: 22, label: "Master bedroom", col: "5 / span 5", row: "7 / span 3" },
  { frame: 24, label: "Bathroom", col: "10 / span 3", row: "7 / span 3", pos: "72% 50%" },
  { frame: 17, label: "Dining at sunset", col: "5 / span 4", row: "10 / span 3" },
  { frame: 27, label: "Guest suite", col: "9 / span 4", row: "10 / span 3" },
  { frame: 32, label: "The pool", col: "1 / span 5", row: "13 / span 3", wide: true },
  { frame: 37, label: "Last light", col: "6 / span 7", row: "13 / span 3", wide: true },
];

/* ----------------------------- Location ---------------------------- */
/** SAMPLE places and drive times. x / y place each on the 500 x 400 drawn map (villa = 250, 200). */
export const CATEGORIES = ["Beaches", "Restaurants", "Attractions", "Shopping", "Transport"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ATTRACTIONS: readonly { name: string; time: string; cat: Category; x: number; y: number }[] = [
  { name: "Sunset beach club", time: "8 min", cat: "Beaches", x: 165, y: 292 },
  { name: "Hidden cove", time: "14 min", cat: "Beaches", x: 330, y: 335 },
  { name: "Marina dining", time: "12 min", cat: "Restaurants", x: 385, y: 285 },
  { name: "Village cafés", time: "10 min", cat: "Restaurants", x: 120, y: 205 },
  { name: "Old town & temple", time: "18 min", cat: "Attractions", x: 95, y: 110 },
  { name: "Golf course", time: "15 min", cat: "Attractions", x: 300, y: 90 },
  { name: "Village market", time: "10 min", cat: "Shopping", x: 375, y: 150 },
  { name: "Airport", time: "35 min", cat: "Transport", x: 440, y: 55 },
] as const;

/* ------------------------------ Booking ---------------------------- */
/** SAMPLE rate and blocked dates (days from today, inclusive). Replace with your calendar. */
export const RATE = { perNight: 450, currency: "$" };
export const BLOCKED_OFFSETS: readonly [number, number][] = [[6, 10], [21, 27]];

/* --------------------------- Feature grid -------------------------- */

export const FEATURES = [
  { icon: "🏡", title: "Luxury Villa", frame: 6 },
  { icon: "🏊", title: "Infinity Pool", frame: 32 },
  { icon: "🌴", title: "Private Tropical Garden", frame: 3 },
  { icon: "🌊", title: "Ocean View", frame: 37 },
  { icon: "🛏️", title: "Premium Bedrooms", frame: 22 },
  { icon: "🍽️", title: "Outdoor Dining", frame: 17 },
  { icon: "🌅", title: "Sunset Lounge", frame: 35 },
  { icon: "🚗", title: "Private Parking", frame: 8 },
] as const;

/** Floor plan on a 12 x 6 grid. Sizes (metres) are SAMPLE values: replace with the real ones. */
export const ROOMS = [
  { id: "entrance", name: "Entrance", x: 0, y: 2, w: 2, h: 2, size: "3.0 × 3.0 m", frame: 9 },
  { id: "living", name: "Living Room", x: 2, y: 1, w: 4, h: 4, size: "8.0 × 7.5 m", frame: 13 },
  { id: "kitchen", name: "Kitchen", x: 6, y: 1, w: 2, h: 2, size: "4.5 × 4.0 m", frame: 15 },
  { id: "dining", name: "Dining", x: 6, y: 3, w: 2, h: 2, size: "4.5 × 4.0 m", frame: 17 },
  { id: "master", name: "Master Bedroom", x: 2, y: 5, w: 3, h: 1, size: "6.0 × 5.0 m", frame: 22 },
  { id: "bath", name: "Bathroom", x: 5, y: 5, w: 1, h: 1, size: "3.0 × 4.0 m", frame: 24 },
  { id: "guest", name: "Guest Suite", x: 6, y: 5, w: 2, h: 1, size: "5.0 × 4.5 m", frame: 27 },
  { id: "pool", name: "Infinity Pool", x: 8, y: 0, w: 4, h: 6, size: "12.0 × 5.0 m", frame: 32, water: true },
] as const;
