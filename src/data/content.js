// All copy and numbers in one place — edit here.
export const BRAND = {
  name: "Parva",
  project: "Parva Residence",
  developer: "Parva Realty",
  city: "the city",
  phone: "+91 00000 00000",
  email: "sales@parvarealty.com",
};

// ---------- Tower & floors ----------
// Every residential floor (04 → 31) can be explored. Each floor uses one of the
// typical plates below; every home on it opens its own plan.
export const TYPE_COLORS = {
  studio: "#e6a24a", "1bhk": "#6fa8dc", "1bhks": "#4f7fd0", "2bhk": "#7cc28a", "2bhkm": "#4fae86",
  "3bhk": "#8a7be0", "4bhk": "#c6d96a", villa: "#e58f73", roof: "#d9b46a",
};

// Unit slots on a plate (SVG coords, plate is 1000 x 640). Core sits in the middle.
export const SLOTS = {
  LT: [60, 60, 350, 250], LB: [60, 330, 350, 250], RT: [590, 60, 350, 250], RB: [590, 330, 350, 250],
  MT: [410, 60, 180, 140], MB: [410, 440, 180, 140], L: [60, 60, 350, 520], R: [590, 60, 350, 520],
  W: [60, 60, 880, 520],
};
export const CORE = [410, 200, 180, 240];

// Every band of floors mixes different homes.
export const PLATES = {
  A: { name: "Garden levels", units: [["LT", "1bhk"], ["MT", "studio"], ["RT", "1bhks"], ["LB", "2bhk"], ["MB", "studio"], ["RB", "1bhk"]] },
  B: { name: "City levels", units: [["LT", "2bhk"], ["MT", "studio"], ["RT", "2bhkm"], ["LB", "1bhks"], ["RB", "3bhk"]] },
  C: { name: "Skyline levels", units: [["LT", "3bhk"], ["RT", "2bhkm"], ["LB", "2bhk"], ["RB", "3bhk"]] },
  D: { name: "Penthouse levels", units: [["L", "4bhk"], ["R", "3bhk"]] },
  V: { name: "Sky villa", core: false, units: [["W", "villa"]] },
  R: { name: "Rooftop penthouse", core: false, units: [["W", "roof"]] },
};

export const FIRST_FLOOR = 1, LAST_FLOOR = 12;
export const plateFor = (f) => (f <= 3 ? "A" : f <= 6 ? "B" : f <= 9 ? "C" : f === 10 ? "D" : f === 11 ? "V" : "R");
export const FLOORS = Array.from({ length: LAST_FLOOR - FIRST_FLOOR + 1 }, (_, i) => {
  const n = FIRST_FLOOR + i, plate = plateFor(n);
  return {
    n, label: plate === "R" ? "Rooftop" : `Level ${String(n).padStart(2, "0")}`, plate,
    units: PLATES[plate].units.map(([slot, plan], k) => ({ id: `${n}${String(k + 1).padStart(2, "0")}`, slot, plan, color: TYPE_COLORS[plan] })),
  };
});

// Where the floors sit on the building photo, in the photo's own pixels (1200 x 1800).
// Levels 01–11 run from `bottom` up to `top`; Level 12 (rooftop) runs from `top` up to `roofTop`.
// Tweak these if you swap the building photo.
export const TOWER_GEO = { w: 1200, h: 1800, left: 222, right: 1150, bottom: 1464, top: 180, roofTop: 120 };

// Plans: rooms are [x, y, w, h, label] on a 100-wide grid (balcony / terrace on the far side).
export const PLANS = {
  studio: {
    title: "Studio", type: "Type S",
    specs: [["Apartment area", "452 sq ft"], ["Balcony", "68 sq ft"], ["Total area", "520 sq ft"]],
    rooms: [[0, 0, 62, 60, "Living / Sleep"], [62, 0, 38, 32, "Kitchen"], [62, 32, 38, 28, "Bath"], [0, 60, 100, 22, "Balcony"]],
  },
  "1bhk": {
    title: "1 Bedroom", type: "Type A1",
    specs: [["Apartment area", "702 sq ft"], ["Balcony", "96 sq ft"], ["Total area", "798 sq ft"]],
    rooms: [[0, 0, 44, 48, "Living"], [44, 0, 22, 26, "Kitchen"], [44, 26, 22, 22, "Powder"], [66, 0, 34, 48, "Bedroom"],
            [0, 48, 44, 20, "Dining"], [44, 48, 22, 20, "Entry"], [66, 48, 34, 20, "Bath"], [0, 68, 100, 16, "Balcony"]],
  },
  "1bhks": {
    title: "1 Bedroom + Study", type: "Type A2",
    specs: [["Apartment area", "821 sq ft"], ["Balcony", "104 sq ft"], ["Total area", "925 sq ft"]],
    rooms: [[0, 0, 40, 42, "Living / Dining"], [40, 0, 22, 24, "Kitchen"], [62, 0, 38, 42, "Bedroom"], [40, 24, 22, 18, "Study"],
            [62, 42, 22, 22, "Bath"], [84, 42, 16, 22, "W.I.C"], [0, 42, 24, 22, "Entry"], [24, 42, 38, 22, "Powder"], [0, 64, 100, 16, "Balcony"]],
  },
  "2bhk": {
    title: "2 Bedroom — Split", type: "Type B1",
    specs: [["Apartment area", "1,108 sq ft"], ["Balcony", "142 sq ft"], ["Total area", "1,250 sq ft"]],
    rooms: [[0, 0, 30, 40, "Master bedroom"], [0, 40, 30, 20, "Master bath"], [30, 0, 40, 44, "Living"], [30, 44, 22, 16, "Kitchen"],
            [52, 44, 18, 16, "Dining"], [70, 0, 30, 36, "Bedroom 2"], [70, 36, 30, 24, "Bath"], [0, 60, 100, 18, "Balcony"]],
  },
  "2bhkm": {
    title: "2 Bedroom + Maid's", type: "Type B2",
    specs: [["Apartment area", "1,286 sq ft"], ["Balcony", "164 sq ft"], ["Total area", "1,450 sq ft"]],
    rooms: [[0, 0, 40, 38, "Living"], [40, 0, 26, 38, "Dining"], [66, 0, 34, 30, "Master bedroom"], [66, 30, 34, 18, "Walk-in"],
            [0, 38, 24, 24, "Kitchen"], [24, 38, 16, 14, "Maid's room"], [24, 52, 16, 10, "Laundry"], [40, 38, 26, 24, "Bedroom 2"],
            [66, 48, 34, 14, "Master bath"], [0, 62, 66, 16, "Balcony"], [66, 62, 34, 16, "Bath"]],
  },
  "3bhk": {
    title: "3 Bedroom Corner", type: "Type C",
    specs: [["Apartment area", "1,742 sq ft"], ["Wrap balcony", "268 sq ft"], ["Total area", "2,010 sq ft"]],
    rooms: [[0, 0, 34, 34, "Master bedroom"], [34, 0, 32, 40, "Living"], [66, 0, 34, 26, "Dining"], [66, 26, 34, 20, "Kitchen"],
            [0, 34, 34, 16, "Master bath"], [0, 50, 26, 26, "Bedroom 2"], [26, 50, 22, 26, "Bedroom 3"], [48, 40, 18, 20, "Bath"],
            [48, 60, 18, 16, "Study"], [66, 46, 34, 30, "Family"], [0, 76, 100, 14, "Wrap balcony"]],
  },
  "4bhk": {
    title: "4 Bedroom Penthouse\nwith Jacuzzi", type: "Type P",
    specs: [["Apartment area", "2,487 sq ft"], ["Terrace", "322 sq ft"], ["Total area", "2,809 sq ft"]],
    rooms: [[0, 0, 44, 38, "Grand salon"], [44, 0, 26, 22, "Dining"], [70, 0, 30, 28, "Master suite"], [70, 28, 30, 16, "Spa bath"],
            [44, 22, 26, 22, "Kitchen"], [0, 38, 24, 26, "Bedroom 2"], [24, 38, 20, 26, "Bedroom 3"], [44, 44, 26, 20, "Bedroom 4"],
            [70, 44, 30, 20, "Library"], [0, 64, 62, 20, "Terrace · Jacuzzi"], [62, 64, 38, 20, "Sky deck"]],
  },
  villa: {
    title: "Sky Villa\n5 Bedrooms · Private Pool", type: "Type V",
    specs: [["Interior area", "5,120 sq ft"], ["Pool & terraces", "1,460 sq ft"], ["Total area", "6,580 sq ft"]],
    rooms: [[0, 0, 24, 36, "Master suite"], [0, 36, 24, 18, "Spa bath"], [24, 0, 20, 24, "Dressing"], [24, 24, 20, 30, "Library"],
            [44, 0, 30, 40, "Grand living"], [74, 0, 26, 26, "Dining"], [74, 26, 26, 20, "Kitchen"], [44, 40, 14, 14, "Powder"],
            [58, 40, 16, 14, "Lift lobby"], [0, 54, 22, 32, "Bedroom 2"], [22, 54, 20, 32, "Bedroom 3"], [42, 54, 16, 32, "Bedroom 4"],
            [58, 54, 16, 32, "Bedroom 5"], [74, 46, 26, 18, "Infinity pool"], [74, 64, 26, 22, "Pool deck"]],
  },
  roof: {
    title: "Rooftop Penthouse\nwith Private Pool", type: "Type R",
    specs: [["Interior area", "3,640 sq ft"], ["Pool deck & garden", "2,180 sq ft"], ["Total area", "5,820 sq ft"]],
    rooms: [[0, 0, 28, 40, "Master suite"], [0, 40, 28, 20, "Spa bath"], [28, 0, 30, 34, "Sky living"], [28, 34, 18, 26, "Kitchen"],
            [46, 34, 12, 26, "Lift lobby"], [58, 0, 42, 26, "Infinity pool"], [58, 26, 42, 34, "Pool deck"],
            [0, 60, 28, 26, "Bedroom 2"], [28, 60, 30, 26, "Bedroom 3"], [58, 60, 42, 26, "Sky garden"]],
  },
};

export const AMENITIES = [
  { name: "Infinity pool", note: "Edge-to-sky water on the podium deck.", img: "pool2" },
  { name: "Rooftop sky lounge", note: "Twelve floors up, with the whole city as the view.", img: "towerdusk" },
  { name: "Adults' swimming pool", note: "A quiet lap pool, kept for lengths, not splashing.", img: "pool" },
  { name: "Residents' gym", note: "Open from first light, with garden views.", img: "gym" },
  { name: "Wellness studio", note: "Yoga, pilates and stretch, morning and evening.", img: "gym2" },
  { name: "Sauna & steam", note: "Cedar, stone and heat for the hour the city slows.", img: "sauna" },
  { name: "Landscaped courtyard", note: "Shade trees, water and somewhere to read.", img: "courtyard" },
  { name: "Kids' play garden", note: "Shaded play and a splash pad, in sight of the lounge.", img: "courtyard2" },
  { name: "Open-air lounge", note: "Sofas under the sky for long evenings.", img: "balcony" },
  { name: "Barbecue terrace", note: "A grill, a long table, and room for everyone.", img: "terrace" },
  { name: "Reading garden", note: "A quiet corner for the first coffee of the day.", img: "atrium" },
  { name: "Residents' lobby lounge", note: "Coffee on the house, every morning.", img: "arrive2" },
];

export const REACH = [
  ["01", "Metro station", "3 min"],
  ["02", "International schools", "5 min"],
  ["03", "Waterfront promenade", "6 min"],
  ["04", "Business district", "8 min"],
  ["05", "International airport", "22 min"],
];

// A day at Parva — the horizontal chapter
export const DAY = [
  { time: "07:00", part: "Morning", title: "Coffee on the courtyard", text: "The city is still waking up below and the courtyard is already in shade.", img: "courtyard" },
  { time: "09:30", part: "Morning", title: "Strength, with a view", text: "A residents' gym with garden views, open from first light.", img: "gym" },
  { time: "13:00", part: "Midday", title: "Lengths before lunch", text: "An adults' lap pool on the podium, quiet all afternoon.", img: "pool2" },
  { time: "16:30", part: "Afternoon", title: "Steam, stone, stillness", text: "Sauna and steam for the hour the city slows down.", img: "sauna" },
  { time: "19:00", part: "Evening", title: "A table that seats twelve", text: "The barbecue terrace, a long table and everyone you like.", img: "terrace" },
  { time: "22:30", part: "Night", title: "The long soak", text: "Spa bathrooms as standard: freestanding tubs and rain showers.", img: "bath" },
];
