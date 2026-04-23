import { AnimatedEntry } from "@/components/AnimatedEntry";
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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("All");

  // Get unique equipment types from exercises
  const equipmentTypes = useMemo(() => {
    const types = new Set(exercises.map((ex) => ex.equipment));
    return ["All", ...Array.from(types).sort()];
  }, [exercises]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search by name
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by difficulty
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        exercise.difficulty === selectedDifficulty;

      // Filter by equipment
      const matchesEquipment =
        selectedEquipment === "All" || exercise.equipment === selectedEquipment;

      return matchesSearch && matchesDifficulty && matchesEquipment;
    });
  }, [exercises, searchQuery, selectedDifficulty, selectedEquipment]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedDifficulty !== "All" ||
    selectedEquipment !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDifficulty("All");
    setSelectedEquipment("All");
  };

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

  const renderItem = ({ item, index }: { item: Exercise; index: number }) => (
    <AnimatedEntry index={Math.min(index, 8)} stagger={40} from="down">
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
          style={[
            styles.imageContainer,
            { backgroundColor: C.surfaceHighlight },
          ]}
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
              {
                flexDirection: isRTL ? "row-reverse" : "row",
                alignSelf: isRTL ? "flex-end" : "flex-start",
              },
            ]}
          >
            <View
              style={[styles.primaryTag, { backgroundColor: `${C.primary}18` }]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: C.primary,
                    fontFamily: fontBold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {item.duration
                  ? `${item.sets} × ${item.duration}s`
                  : `${item.sets} × ${item.reps}`}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.tagsRow,
              {
                flexDirection: isRTL ? "row-reverse" : "row",
                alignSelf: isRTL ? "flex-end" : "flex-start",
              },
            ]}
          >
            <View style={[styles.tag, { backgroundColor: C.surfaceHighlight }]}>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: C.textSecondary,
                    fontFamily: fontSemibold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t(language, `equipmentNames.${item.equipment}`)}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: C.surfaceHighlight }]}>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: C.textSecondary,
                    fontFamily: fontSemibold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t(language, `difficultyNames.${item.difficulty}`)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </AnimatedEntry>
  );

  const muscleTitle = t(language, `muscles.${muscle}`);

  const renderFilterChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
    key?: string,
  ) => (
    <TouchableOpacity
      key={key ?? label}
      style={[
        styles.filterChip,
        {
          backgroundColor: isSelected ? C.primary : C.surfaceHighlight,
          borderColor: isSelected ? C.primary : "transparent",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color: isSelected ? "#fff" : C.textSecondary,
            fontFamily: isSelected ? fontBold : fontSemibold,
            textAlign: "center",
            fontSize: isRTL ? 12 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="search-outline" size={64} color={C.textSecondary} />
      <Text
        style={[
          styles.emptyStateTitle,
          { color: C.text, fontFamily: fontBold, textAlign: "center" },
        ]}
      >
        {t(language, "exerciseList.noResults")}
      </Text>
      <Text
        style={[
          styles.emptyStateText,
          {
            color: C.textSecondary,
            fontFamily: fontSemibold,
            textAlign: "center",
          },
        ]}
      >
        {t(language, "exerciseList.tryDifferentFilters")}
      </Text>
      {hasActiveFilters && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: C.primary }]}
          onPress={clearFilters}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.clearButtonText,
              { color: "#fff", fontFamily: fontBold, textAlign: "center" },
            ]}
          >
            {t(language, "exerciseList.clearFilters")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TopBar showBack title={muscleTitle} />

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: C.surface,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={C.textSecondary}
          style={[
            styles.searchIcon,
            isRTL ? { marginLeft: 8 } : { marginRight: 8 },
          ]}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: C.text,
              fontFamily: fontSemibold,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          placeholder={t(language, "exerciseList.searchPlaceholder")}
          placeholderTextColor={C.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearIcon}
          >
            <Ionicons name="close-circle" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Difficulty Filter */}
      <View style={styles.filterSection}>
        <Text
          style={[
            styles.filterLabel,
            {
              color: C.text,
              fontFamily: fontBold,
              textAlign: isRTL ? "right" : "left",
              paddingLeft: isRTL ? 0 : Spacing.lg,
              paddingRight: isRTL ? Spacing.lg : 0,
            },
          ]}
        >
          {t(language, "exerciseList.difficulty")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterChipsContainer,
            {
              paddingHorizontal: Spacing.lg,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
          style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
          inverted={isRTL}
        >
          {["All", "Beginner", "Intermediate", "Advanced"].map((difficulty) =>
            renderFilterChip(
              difficulty === "All"
                ? t(language, "exerciseList.all")
                : t(language, `difficultyNames.${difficulty}`),
              selectedDifficulty === difficulty,
              () => setSelectedDifficulty(difficulty),
              `diff-${difficulty}`,
            ),
          )}
        </ScrollView>
      </View>

      {/* Equipment Filter */}
      <View style={styles.filterSection}>
        <Text
          style={[
            styles.filterLabel,
            {
              color: C.text,
              fontFamily: fontBold,
              textAlign: isRTL ? "right" : "left",
              paddingLeft: isRTL ? 0 : Spacing.lg,
              paddingRight: isRTL ? Spacing.lg : 0,
            },
          ]}
        >
          {t(language, "exerciseList.equipment")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterChipsContainer,
            {
              paddingHorizontal: Spacing.lg,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
          style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
          inverted={isRTL}
        >
          {equipmentTypes.map((equipment) =>
            renderFilterChip(
              equipment === "All"
                ? t(language, "exerciseList.all")
                : t(language, `equipmentNames.${equipment}`),
              selectedEquipment === equipment,
              () => setSelectedEquipment(equipment),
              `eq-${equipment}`,
            ),
          )}
        </ScrollView>
      </View>

      {/* Results Count & Clear Filters */}
      <View
        style={[
          styles.resultsBar,
          {
            flexDirection: isRTL ? "row-reverse" : "row",
            paddingHorizontal: Spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.resultsText,
            { color: C.textSecondary, fontFamily: fontSemibold },
          ]}
        >
          {filteredExercises.length} {t(language, "exerciseList.exercises")}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
            <Text
              style={[
                styles.clearFiltersText,
                { color: C.primary, fontFamily: fontBold },
              ]}
            >
              {t(language, "exerciseList.clearAll")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingBottom: 24,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 4,
    paddingHorizontal: 4,
    // @ts-expect-error web-only
    outlineStyle: "none",
  },
  clearIcon: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: Spacing.lg,
  },
  filterChipsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
  },
  filterChipText: {
    lineHeight: 16,
    fontSize: 12,
  },
  resultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  resultsText: {
    fontSize: 13,
  },
  clearFiltersText: {
    fontSize: 13,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  clearButtonText: {
    fontSize: 15,
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
