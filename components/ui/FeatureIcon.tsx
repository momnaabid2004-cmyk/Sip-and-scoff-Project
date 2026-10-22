import type { FeatureIcon as Key } from "@/lib/db/types";
import { FamilyIcon, HalalIcon, LeafIcon, MoonIcon, MusicIcon, ParkingIcon, StarIcon, TruckIcon, WalletIcon, WifiIcon } from "./Icons";

const MAP = { wifi: WifiIcon, moon: MoonIcon, family: FamilyIcon, truck: TruckIcon, halal: HalalIcon, wallet: WalletIcon, leaf: LeafIcon, star: StarIcon, music: MusicIcon, parking: ParkingIcon };
export const FEATURE_ICONS = Object.keys(MAP) as Key[];

export function FeatureIcon({ icon, className }: { icon: Key; className?: string }) {
  const I = MAP[icon] ?? StarIcon;
  return <I className={className} />;
}
