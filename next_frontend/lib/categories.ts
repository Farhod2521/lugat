// Har bir kategoriya o'z RANGI bilan emas, o'z SHAKLI (ikonka) bilan farqlanadi.
// Yozuvlar bitta rang oilasida bo'lishi uchun ranglar bu yerda saqlanmaydi.
import type { LucideIcon } from "lucide-react";
import {
  PartyPopper,
  Soup,
  Flame,
  HandHeart,
  Gem,
  Shirt,
  Landmark,
  Music,
  Users,
  MessageSquare,
  Home,
  Tag,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Bayram: PartyPopper,
  Taom: Soup,
  Marosim: Flame,
  "Urf-odat": HandHeart,
  Qadriyat: Gem,
  Kiyim: Shirt,
  Joy: Landmark,
  Hunarmandchilik: Music,
  Qarindoshlik: Users,
  Murojaat: MessageSquare,
  Jamiyat: Home,
};

export function catIcon(kategoriya: string): LucideIcon {
  return ICONS[kategoriya] || Tag;
}
