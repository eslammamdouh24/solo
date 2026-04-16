import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";

interface DefaultAvatarProps {
  size?: number;
  gender?: string;
}

export function DefaultAvatar({ size = 80, gender }: DefaultAvatarProps) {
  const C = useColors();
  return (
    <MaterialCommunityIcons
      name={gender === "female" ? "face-woman" : "face-man"}
      size={size}
      color={C.primary}
    />
  );
}

export function DefaultAvatarSmall({ size = 28, gender }: DefaultAvatarProps) {
  const C = useColors();
  return (
    <MaterialCommunityIcons
      name={gender === "female" ? "face-woman" : "face-man"}
      size={size}
      color={C.primary}
    />
  );
}
