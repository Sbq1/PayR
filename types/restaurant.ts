export interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  customTheme?: {
    fontFamily?: string;
    backgroundImage?: string;
    borderRadius?: string;
    headerStyle?: string;
  } | null;
}

export interface RestaurantPublic {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: RestaurantTheme;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  posProvider: string;
  hasSiigoCredentials: boolean;
  hasWompiCredentials: boolean;
  isActive: boolean;
  planTier: string;
  planName: string;
}
