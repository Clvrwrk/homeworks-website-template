// Testimonials shown on the homepage. Replace with real client reviews.
export interface ReviewDef {
  name: string;
  location: string;
  rating: number;
  initials: string;
  text: string;
}

export const REVIEWS: ReviewDef[] = [
  {
    name: "Sarah M.",
    location: "{{ADDRESS_CITY}}, {{ADDRESS_STATE}}",
    rating: 5,
    initials: "SM",
    text: "Absolutely fantastic service! They patched three drywall holes and you can't tell anything was ever there. Showed up on time and left my home spotless.",
  },
  {
    name: "James R.",
    location: "{{ADDRESS_CITY}}, {{ADDRESS_STATE}}",
    rating: 5,
    initials: "JR",
    text: "Had a long list of items that had been piling up. They knocked out everything in one visit — TV mount, a leaky faucet, and replaced two doors. Incredible value.",
  },
  {
    name: "Linda K.",
    location: "{{ADDRESS_CITY}}, {{ADDRESS_STATE}}",
    rating: 5,
    initials: "LK",
    text: "So relieved to finally find a service I can trust. Background-checked, insured, and genuinely professional. Will be using them for everything going forward.",
  },
];
