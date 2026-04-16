import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MilestoneModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

const MILESTONE_REWARDS: Record<
  number,
  { titleKey: string; amount: number; icon: string }
> = {
  5: {
    titleKey: "milestone.bronzeChampion",
    amount: 50,
    icon: "trophy-outline",
  },
  10: { titleKey: "milestone.silverWarrior", amount: 100, icon: "trophy" },
  15: { titleKey: "milestone.goldAthlete", amount: 200, icon: "trophy-award" },
  20: { titleKey: "milestone.platinumLegend", amount: 300, icon: "crown" },
  25: { titleKey: "milestone.diamondMaster", amount: 500, icon: "diamond" },
  30: { titleKey: "milestone.eliteChampion", amount: 750, icon: "star" },
  35: {
    titleKey: "milestone.supremeVictor",
    amount: 1000,
    icon: "star-circle",
  },
  40: { titleKey: "milestone.legendaryHero", amount: 1500, icon: "medal" },
  45: { titleKey: "milestone.mythicTitan", amount: 2000, icon: "shield-star" },
  50: {
    titleKey: "milestone.ultimateMaster",
    amount: 3000,
    icon: "trophy-variant",
  },
  // Post-50 milestones
  55: {
    titleKey: "milestone.immortalWarrior",
    amount: 4000,
    icon: "sword-cross",
  },
  60: {
    titleKey: "milestone.cosmicForce",
    amount: 5000,
    icon: "weather-lightning",
  },
  65: { titleKey: "milestone.titanSlayer", amount: 6000, icon: "axe-battle" },
  70: { titleKey: "milestone.dragonHeart", amount: 7500, icon: "fire" },
  75: {
    titleKey: "milestone.celestialKing",
    amount: 9000,
    icon: "star-shooting",
  },
  80: { titleKey: "milestone.eternaChampion", amount: 10000, icon: "infinity" },
  85: { titleKey: "milestone.shadowMaster", amount: 12000, icon: "ninja" },
  90: { titleKey: "milestone.warlord", amount: 15000, icon: "creation" },
  95: { titleKey: "milestone.universalLegend", amount: 18000, icon: "meteor" },
  100: { titleKey: "milestone.theOne", amount: 25000, icon: "crown-circle" },
};

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  visible,
  level,
  onClose,
}) => {
  const { language } = useApp();
  const reward = MILESTONE_REWARDS[level];
  const milestoneTitle = reward
    ? t(language, reward.titleKey)
    : t(language, "milestone.levelMilestone", { level });
  const milestoneAmount = reward ? reward.amount : level * 50;
  const milestonePrize = t(language, "milestone.bonusXP", {
    amount: milestoneAmount,
  });
  const milestoneIcon = reward ? reward.icon : "trophy";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            style={styles.gradient}
          >
            {/* Star decorations */}
            <View style={styles.starsContainer}>
              {[...Array(8)].map((_, i) => (
                <MaterialCommunityIcons
                  key={i}
                  name="star-four-points"
                  size={20}
                  color="#FFD700"
                  style={[
                    styles.star,
                    {
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Main content */}
            <MaterialCommunityIcons
              name={milestoneIcon as any}
              size={100}
              color="#FFD700"
              style={styles.icon}
            />

            <Text style={styles.congratsText}>
              {t(language, "milestone.reached")}
            </Text>
            <Text style={styles.levelText}>
              {t(language, "milestone.level", { level })}
            </Text>
            <Text style={styles.titleText}>{milestoneTitle}</Text>

            <View style={styles.prizeContainer}>
              <MaterialCommunityIcons name="gift" size={24} color="#FF6B6B" />
              <Text style={styles.prizeText}>{milestonePrize}</Text>
            </View>

            <Text style={styles.messageText}>
              {t(language, "milestone.message")}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {t(language, "milestone.claimReward")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: Dimensions.get("window").width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    padding: 30,
    alignItems: "center",
  },
  starsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: "absolute",
    opacity: 0.6,
  },
  icon: {
    marginBottom: 20,
    ...(Platform.OS === "web"
      ? { textShadow: "0px 0px 20px rgba(255, 215, 0, 0.8)" }
      : {
          textShadowColor: "rgba(255, 215, 0, 0.8)",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 20,
        }),
  } as any,
  congratsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  levelText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 20,
    textAlign: "center",
  },
  prizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    gap: 10,
  },
  prizeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
  },
  messageText: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
});

export const getMilestoneBonusXP = (level: number): number => {
  const milestone = MILESTONE_REWARDS[level];
  if (!milestone) return level * 50; // Default bonus
  return milestone.amount;
};
