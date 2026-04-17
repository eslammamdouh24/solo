import { MILESTONE_MAP } from "@/constants/milestones";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
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

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  visible,
  level,
  onClose,
}) => {
  const { language } = useApp();
  const reward = MILESTONE_MAP[level];
  const milestoneTitle = reward
    ? t(language, reward.titleKey)
    : t(language, "milestone.levelMilestone", { level });
  const milestoneAmount = reward ? reward.amount : level * 50;
  const milestonePrize = t(language, "milestone.bonusXP", {
    amount: milestoneAmount,
  });
  const milestoneIcon = reward ? reward.icon : "trophy";

  // Pre-compute star positions to avoid re-randomizing on every render
  const starPositions = React.useMemo(
    () =>
      [...Array(8)].map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
      })),
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            style={styles.gradient}
          >
            {/* Star decorations */}
            <View style={styles.starsContainer}>
              {starPositions.map((pos, i) => (
                <MaterialCommunityIcons
                  key={i}
                  name="star-four-points"
                  size={20}
                  color="#FFD700"
                  style={[
                    styles.star,
                    {
                      top: pos.top as any,
                      left: pos.left as any,
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

            {/* Tap anywhere hint */}
            <Text style={styles.tapHint}>Tap outside to dismiss</Text>
          </LinearGradient>
        </Pressable>
      </Pressable>
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
  tapHint: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 12,
    textAlign: "center",
  },
});
