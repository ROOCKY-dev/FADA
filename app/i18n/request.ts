import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(() => {
  // For static export, we return a hardcoded locale
  // The actual messages are passed via IntlProvider client component
  return {
    locale: "ar",
    messages: {},
  };
});
