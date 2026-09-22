export const COMPANY_NAME = "KoboRide";
export const COMPANY_EMAIL = "hello@koboride.ng";
export const COMPANY_PHONE_DISPLAY = "+234 903 186 1100";
export const COMPANY_PHONE_TEL = "tel:+2349031861100";
export const COMPANY_SITE = "https://www.koboride.ng";

export const COMPANY_ADDRESS = {
  line1: "Yaba",
  city: "Lagos",
  country: "Nigeria",
};

export function companyAddressText() {
  return `${COMPANY_ADDRESS.line1}, ${COMPANY_ADDRESS.city}, ${COMPANY_ADDRESS.country}`;
}

export const COMPANY_SERVICES = [
  {
    title: "Package pickup and drop-off",
    body: "Book a rider to collect a package from one Lagos address and deliver it to another. You can send or receive.",
  },
  {
    title: "Cash or card",
    body: "Pay the rider in cash, or pay online by card or transfer when you book.",
  },
];
