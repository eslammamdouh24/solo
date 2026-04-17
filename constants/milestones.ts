export interface Milestone {
  level: number;
  titleKey: string;
  amount: number;
  icon: string;
}

export const MILESTONES: Milestone[] = [
  {
    level: 5,
    titleKey: "milestone.bronzeChampion",
    amount: 50,
    icon: "trophy-outline",
  },
  {
    level: 10,
    titleKey: "milestone.silverWarrior",
    amount: 100,
    icon: "trophy",
  },
  {
    level: 15,
    titleKey: "milestone.goldAthlete",
    amount: 200,
    icon: "trophy-award",
  },
  {
    level: 20,
    titleKey: "milestone.platinumLegend",
    amount: 300,
    icon: "crown",
  },
  {
    level: 25,
    titleKey: "milestone.diamondMaster",
    amount: 500,
    icon: "diamond",
  },
  { level: 30, titleKey: "milestone.eliteChampion", amount: 750, icon: "star" },
  {
    level: 35,
    titleKey: "milestone.supremeVictor",
    amount: 1000,
    icon: "star-circle",
  },
  {
    level: 40,
    titleKey: "milestone.legendaryHero",
    amount: 1500,
    icon: "medal",
  },
  {
    level: 45,
    titleKey: "milestone.mythicTitan",
    amount: 2000,
    icon: "shield-star",
  },
  {
    level: 50,
    titleKey: "milestone.ultimateMaster",
    amount: 3000,
    icon: "trophy-variant",
  },
  {
    level: 55,
    titleKey: "milestone.immortalWarrior",
    amount: 4000,
    icon: "sword-cross",
  },
  {
    level: 60,
    titleKey: "milestone.cosmicForce",
    amount: 5000,
    icon: "weather-lightning",
  },
  {
    level: 65,
    titleKey: "milestone.titanSlayer",
    amount: 6000,
    icon: "axe-battle",
  },
  { level: 70, titleKey: "milestone.dragonHeart", amount: 7500, icon: "fire" },
  {
    level: 75,
    titleKey: "milestone.celestialKing",
    amount: 9000,
    icon: "star-shooting",
  },
  {
    level: 80,
    titleKey: "milestone.eternaChampion",
    amount: 10000,
    icon: "infinity",
  },
  {
    level: 85,
    titleKey: "milestone.shadowMaster",
    amount: 12000,
    icon: "ninja",
  },
  { level: 90, titleKey: "milestone.warlord", amount: 15000, icon: "creation" },
  {
    level: 95,
    titleKey: "milestone.universalLegend",
    amount: 18000,
    icon: "meteor",
  },
  {
    level: 100,
    titleKey: "milestone.theOne",
    amount: 25000,
    icon: "crown-circle",
  },
];

export const MILESTONE_MAP: Record<number, Milestone> = Object.fromEntries(
  MILESTONES.map((m) => [m.level, m]),
);

export const getMilestoneBonusXP = (level: number): number => {
  const milestone = MILESTONE_MAP[level];
  if (!milestone) return level * 50;
  return milestone.amount;
};
