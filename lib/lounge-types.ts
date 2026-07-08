export type Lounge = {
  id: string;
  continent: string;
  country: string;
  city: string;
  airport: string;
  code: string;
  terminal: string;
  loungeName: string;
  departureType: string;
  securityType: string;
  directions: string;
};

export type FilterKey =
  | "continent"
  | "country"
  | "city"
  | "airport"
  | "terminal"
  | "departureType"
  | "securityType";

export type LoungeFilters = Record<FilterKey, string> & {
  query: string;
};
