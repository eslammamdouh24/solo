import { Gender } from "@/constants/enums";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, StyleSheet } from "react-native";

interface DefaultAvatarProps {
  size?: number;
  gender?: string;
  imageUri?: string | null;
}

export function DefaultAvatar({
  size = 80,
  gender,
  imageUri,
}: DefaultAvatarProps) {
  const C = useColors();
  const [imageError, setImageError] = useState(false);

  if (imageUri && !imageError) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: C.primary,
          },
        ]}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <MaterialCommunityIcons
      name={gender === Gender.FEMALE ? "face-woman" : "face-man"}
      size={size}
      color={C.primary}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
  },
});
