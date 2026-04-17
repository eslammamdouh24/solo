import { TopBar } from "@/components/TopBar";
import { isRTL as checkRTL } from "@/constants/enums";
import { exerciseImages } from "@/constants/exerciseImages";
import { fonts, getFont } from "@/constants/fonts";
import { Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Exercise, getExercisesByMuscle, MuscleGroup } from "@/lib/exerciseApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const ExerciseListScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const C = useColors();
  const { user } = useAuth();
  const { language } = useApp();
  const isRTL = checkRTL(language);
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const userGender = user?.user_metadata?.gender as string | undefined;
  const muscle = (params as { muscle?: string }).muscle as
    | MuscleGroup
    | undefined;
  const exercises = muscle ? getExercisesByMuscle(muscle, userGender) : [];

  if (!muscle) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: C.background }]}>
        <Text style={[styles.emptyText, { color: C.text }]}>
          {t(language, "exerciseDetail.exerciseNotFound")}
        </Text>
      </View>
    );
  }

  const getImageSource = (exercise: Exercise) => {
    return (
      exerciseImages[exercise.gif] ||
      (exercise.gifUrl ? { uri: exercise.gifUrl } : undefined)
    );
  };

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: C.surface,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/exercise-detail",
          params: { muscle, exerciseId: item.id },
        })
      }
    >
      <View
        style={[styles.imageContainer, { backgroundColor: C.surfaceHighlight }]}
      >
        <Image
          source={getImageSource(item)}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View
        style={[
          styles.info,
          {
            alignItems: isRTL ? "flex-end" : "flex-start",
            marginRight: isRTL ? 14 : 0,
            marginLeft: isRTL ? 0 : 14,
          },
        ]}
      >
        <Text
          style={[
            styles.name,
            {
              color: C.text,
              fontFamily: fonts.en.bold,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View
          style={[
            styles.setsRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View
            style={[styles.primaryTag, { backgroundColor: `${C.primary}18` }]}
          >
            <Text
              style={[
                styles.tagText,
                { color: C.primary, fontFamily: fontBold },
              ]}
            >
              {item.sets} × {item.reps}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.tagsRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View style={[styles.tag, { backgroundColor: C.surfaceHighlight }]}>
            <Text
              style={[
                styles.tagText,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {t(language, `equipmentNames.${item.equipment}`)}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: C.surfaceHighlight }]}>
            <Text
              style={[
                styles.tagText,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {t(language, `difficultyNames.${item.difficulty}`)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const muscleTitle = t(language, `muscles.${muscle}`);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar showBack title={muscleTitle} />
      <FlatList
        data={exercises}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: 24,
          paddingHorizontal: Spacing.lg,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  card: {
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 72,
    height: 72,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  setsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});

export default ExerciseListScreen;
