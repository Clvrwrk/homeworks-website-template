// Content types for Rankability-generated page content.
// SERVICES_CONTENT and LOCATIONS_CONTENT in src/data/ use these shapes.

export interface ServiceContent {
  seoTitle:        string;
  metaDescription: string;
  h1:              string;
  bodyHtml:        string;
  faqs:            Array<{ question: string; answer: string }>;
  faqSchemaJsonLd: string;
}

export interface LocationContent {
  seoTitle:        string;
  metaDescription: string;
  h1:              string;
  bodyHtml:        string;
  faqs:            Array<{ question: string; answer: string }>;
  faqSchemaJsonLd: string;
}

// Placeholder used when Rankability job fails or times out.
export const CONTENT_PLACEHOLDER: ServiceContent = {
  seoTitle:        "Coming Soon",
  metaDescription: "Content being generated. Check back shortly.",
  h1:              "Page Coming Soon",
  bodyHtml:        "<p>Content is being prepared for this page. Please check back shortly.</p>",
  faqs:            [],
  faqSchemaJsonLd: "",
};
