import { ConfirmationBottomSheet } from "@/components/ConfirmationBottomSheet";
import { DefaultAvatar } from "@/components/DefaultAvatar";
import { DropdownPicker } from "@/components/DropdownPicker";
import { TopBar } from "@/components/TopBar";
import { getFont } from "@/constants/fonts";
import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/constants/theme-colors";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useGameStateWithDB } from "@/hooks/useGameStateWithDB";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MILESTONES = [
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
  // Post-50 milestones
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
  {
    level: 70,
    titleKey: "milestone.dragonHeart",
    amount: 7500,
    icon: "fire",
  },
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
  {
    level: 90,
    titleKey: "milestone.warlord",
    amount: 15000,
    icon: "creation",
  },
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

export default function ProfileScreen() {
  const { user, signOut, deleteAccount, updateProfile } = useAuth();
  const { language } = useApp();
  const C = useColors();
  const gameState = useGameStateWithDB();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.user_metadata?.profile_image || null,
  );
  const [imageError, setImageError] = useState(false);
  const [resetSheetOpen, setResetSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(
    user?.user_metadata?.username || "",
  );
  const [editFullName, setEditFullName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [editBirthDay, setEditBirthDay] = useState(
    user?.user_metadata?.birth_day?.toString() || "",
  );
  const [editBirthMonth, setEditBirthMonth] = useState(
    user?.user_metadata?.birth_month?.toString() || "",
  );
  const [editBirthYear, setEditBirthYear] = useState(
    user?.user_metadata?.birth_year?.toString() || "",
  );
  const [editGender, setEditGender] = useState(
    user?.user_metadata?.gender || "",
  );
  const [saving, setSaving] = useState(false);
  const isRTL = language === "ar";
  const fontRegular = getFont(language, "regular");
  const fontSemibold = getFont(language, "semibold");
  const fontBold = getFont(language, "bold");
  const fontBlack = getFont(language, "black");

  // Generate dropdown options for DOB
  const dayOptions = useMemo(
    () =>
      Array.from({ length: 31 }, (_, i) => ({
        label: String(i + 1).padStart(2, "0"),
        value: String(i + 1),
      })),
    [],
  );
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: String(i + 1).padStart(2, "0"),
        value: String(i + 1),
      })),
    [],
  );
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1900 - 12 }, (_, i) => ({
      label: String(currentYear - 13 - i),
      value: String(currentYear - 13 - i),
    }));
  }, []);

  if (gameState.loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: C.background }]}
      >
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const totalStats =
    gameState.strength + gameState.endurance + gameState.discipline;
  const accountAge = user?.created_at
    ? Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleResetProgress = async () => {
    try {
      await gameState.resetProgress();
      Alert.alert(
        t(language, "common.success"),
        t(language, "profile.resetSuccess"),
      );
    } catch {
      Alert.alert(
        t(language, "common.error"),
        t(language, "profile.resetError"),
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      router.replace("/auth");
    } catch (error: any) {
      Alert.alert(
        t(language, "common.error"),
        error.message || t(language, "profile.deleteError"),
      );
    }
  };

  const confirmReset = () => {
    setResetSheetOpen(true);
  };

  const confirmDelete = () => {
    setDeleteSheetOpen(true);
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t(language, "profile.permissionDenied"),
          t(language, "profile.photoPermission"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        setImageError(false);

        try {
          // Upload to Supabase Storage
          const userId = user?.id;
          if (!userId) throw new Error("No user ID");

          const fileExt = imageUri.split(".").pop()?.split("?")[0] || "jpg";
          const fileName = `${userId}/avatar.${fileExt}`;

          // Fetch the image as a blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Convert blob to ArrayBuffer for Supabase
          const arrayBuffer = await new Response(blob).arrayBuffer();

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, arrayBuffer, {
              contentType: blob.type || `image/${fileExt}`,
              upsert: true,
            });

          if (uploadError) throw uploadError;

          // Get the public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          // Save public URL to user_metadata
          setProfileImage(publicUrl);
          await updateProfile({ profile_image: publicUrl });
        } catch (error) {
          console.error("Failed to upload profile image:", error);
          // Still keep local preview even if upload fails
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        username: editUsername.trim() || user?.email?.split("@")[0],
        full_name: editFullName.trim(),
        birth_day: editBirthDay ? parseInt(editBirthDay, 10) : null,
        birth_month: editBirthMonth ? parseInt(editBirthMonth, 10) : null,
        birth_year: editBirthYear ? parseInt(editBirthYear, 10) : null,
        gender: editGender,
      });
      setEditing(false);
      Alert.alert(
        t(language, "common.success"),
        t(language, "profile.saveProfile"),
      );
    } catch (error: any) {
      Alert.alert(t(language, "common.error"), error.message);
    } finally {
      setSaving(false);
    }
  };

  const meta = user?.user_metadata || {};

  return (
    <>
      <View style={[styles.container, { backgroundColor: C.background }]}>
        {/* Sticky TopBar */}
        <View style={[styles.stickyTopBar, { backgroundColor: C.background }]}>
          <TopBar showBack />
        </View>

        {/* Screen Title */}
        <Text
          style={[styles.screenTitle, { color: C.text, fontFamily: fontBlack }]}
        >
          {t(language, "profile.title")}
        </Text>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.main}>
            {/* Profile Card */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <View style={styles.profileHeader}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={handlePickImage}
                >
                  {profileImage && !imageError ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={[styles.avatar, { borderColor: C.primary }]}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <DefaultAvatar size={80} gender={meta.gender} />
                  )}
                  <View
                    style={[
                      styles.editIconContainer,
                      {
                        backgroundColor: C.primary,
                        borderColor: C.background,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={20}
                      color={C.text}
                    />
                  </View>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.userName,
                    { color: C.text, fontFamily: fontBlack },
                  ]}
                >
                  {meta.username || user?.email?.split("@")[0]}
                </Text>
                <Text
                  style={[
                    styles.email,
                    { color: C.textSecondary, fontFamily: fontRegular },
                  ]}
                >
                  {user?.email}
                </Text>
                <Text
                  style={[
                    styles.accountAge,
                    { color: C.textSecondary, fontFamily: fontRegular },
                  ]}
                >
                  {t(language, "profile.memberFor", { days: accountAge })}
                </Text>
              </View>
            </View>

            {/* Personal Info */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <View
                style={[
                  styles.sectionHeader,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: C.textSecondary,
                      fontFamily: fontBold,
                      marginBottom: 0,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {t(language, "profile.personalInfo")}
                </Text>
                {!editing && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditUsername(meta.username || "");
                      setEditFullName(meta.full_name || "");
                      setEditBirthDay(meta.birth_day?.toString() || "");
                      setEditBirthMonth(meta.birth_month?.toString() || "");
                      setEditBirthYear(meta.birth_year?.toString() || "");
                      setEditGender(meta.gender || "");
                      setEditing(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={20}
                      color={C.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {editing ? (
                <View style={styles.editForm}>
                  <View>
                    <Text
                      style={[
                        styles.editLabel,
                        {
                          color: C.textSecondary,
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: fontSemibold,
                        },
                      ]}
                    >
                      {t(language, "auth.username")}
                    </Text>
                    <TextInput
                      style={[
                        styles.editInput,
                        {
                          backgroundColor: C.surfaceHighlight,
                          color: C.text,
                          borderColor: C.surface,
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: fontRegular,
                        },
                      ]}
                      value={editUsername}
                      onChangeText={setEditUsername}
                      placeholder={t(language, "auth.username")}
                      placeholderTextColor={C.textSecondary}
                      autoCapitalize="none"
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.editLabel,
                        {
                          color: C.textSecondary,
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: fontSemibold,
                        },
                      ]}
                    >
                      {t(language, "auth.fullName")}
                    </Text>
                    <TextInput
                      style={[
                        styles.editInput,
                        {
                          backgroundColor: C.surfaceHighlight,
                          color: C.text,
                          borderColor: C.surface,
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: fontRegular,
                        },
                      ]}
                      value={editFullName}
                      onChangeText={setEditFullName}
                      placeholder={t(language, "auth.fullName")}
                      placeholderTextColor={C.textSecondary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.editLabel,
                        {
                          color: C.textSecondary,
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: fontSemibold,
                        },
                      ]}
                    >
                      {t(language, "profile.birthDate")}
                    </Text>
                    <View
                      style={[
                        styles.dobRow,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <DropdownPicker
                          options={dayOptions}
                          value={editBirthDay}
                          onSelect={setEditBirthDay}
                          placeholder={t(language, "auth.birthDay")}
                          isRTL={isRTL}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <DropdownPicker
                          options={monthOptions}
                          value={editBirthMonth}
                          onSelect={setEditBirthMonth}
                          placeholder={t(language, "auth.birthMonth")}
                          isRTL={isRTL}
                        />
                      </View>
                      <View style={{ flex: 1.5 }}>
                        <DropdownPicker
                          options={yearOptions}
                          value={editBirthYear}
                          onSelect={setEditBirthYear}
                          placeholder={t(language, "auth.birthYear")}
                          isRTL={isRTL}
                        />
                      </View>
                    </View>
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.editLabel,
                        {
                          color: C.textSecondary,
                          textAlign: isRTL ? "right" : "left",
                          fontFamily: fontSemibold,
                        },
                      ]}
                    >
                      {t(language, "auth.gender")}
                    </Text>
                    <View
                      style={[
                        styles.genderRow,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          {
                            borderColor: C.surface,
                            backgroundColor: C.surfaceHighlight,
                          },
                          editGender === "male" && {
                            borderColor: C.primary,
                            backgroundColor: `${C.primary}22`,
                          },
                        ]}
                        onPress={() => setEditGender("male")}
                      >
                        <MaterialCommunityIcons
                          name="gender-male"
                          size={18}
                          color={
                            editGender === "male" ? C.primary : C.textSecondary
                          }
                        />
                        <Text
                          style={{
                            color:
                              editGender === "male"
                                ? C.primary
                                : C.textSecondary,
                            fontWeight: "600",
                            fontSize: FontSize.sm,
                            fontFamily: fontSemibold,
                          }}
                        >
                          {t(language, "profile.male")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          {
                            borderColor: C.surface,
                            backgroundColor: C.surfaceHighlight,
                          },
                          editGender === "female" && {
                            borderColor: C.primary,
                            backgroundColor: `${C.primary}22`,
                          },
                        ]}
                        onPress={() => setEditGender("female")}
                      >
                        <MaterialCommunityIcons
                          name="gender-female"
                          size={18}
                          color={
                            editGender === "female"
                              ? C.primary
                              : C.textSecondary
                          }
                        />
                        <Text
                          style={{
                            color:
                              editGender === "female"
                                ? C.primary
                                : C.textSecondary,
                            fontWeight: "600",
                            fontSize: FontSize.sm,
                            fontFamily: fontSemibold,
                          }}
                        >
                          {t(language, "profile.female")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {editing && (
                    <View
                      style={[
                        styles.editActionsRow,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={handleSaveProfile}
                        disabled={saving}
                        style={[
                          styles.editActionButton,
                          {
                            backgroundColor: C.primary,
                            flex: 1,
                          },
                        ]}
                      >
                        {saving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text
                            style={[
                              styles.saveButtonText,
                              { fontFamily: fontBold },
                            ]}
                          >
                            {t(language, "profile.saveProfile")}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditing(false)}
                        style={[
                          styles.editActionButton,
                          {
                            backgroundColor: "transparent",
                            borderColor: C.textMuted,
                            borderWidth: 1,
                            flex: 1,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: C.textSecondary,
                            fontWeight: "600",
                            fontSize: FontSize.sm,
                            fontFamily: fontSemibold,
                          }}
                        >
                          {t(language, "common.cancel")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.infoList}>
                  <View
                    style={[
                      styles.infoRow,
                      {
                        backgroundColor: C.surfaceHighlight,
                        flexDirection: isRTL ? "row-reverse" : "row",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoLeft,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={18}
                        color={C.primary}
                      />
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: C.textSecondary, fontFamily: fontSemibold },
                        ]}
                      >
                        {t(language, "auth.fullName")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: C.text, fontFamily: fontBold },
                      ]}
                    >
                      {meta.full_name || t(language, "profile.notSet")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoRow,
                      {
                        backgroundColor: C.surfaceHighlight,
                        flexDirection: isRTL ? "row-reverse" : "row",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoLeft,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="at"
                        size={18}
                        color={C.primary}
                      />
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: C.textSecondary, fontFamily: fontSemibold },
                        ]}
                      >
                        {t(language, "auth.username")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: C.text, fontFamily: fontBold },
                      ]}
                    >
                      {meta.username || t(language, "profile.notSet")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoRow,
                      {
                        backgroundColor: C.surfaceHighlight,
                        flexDirection: isRTL ? "row-reverse" : "row",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoLeft,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="calendar"
                        size={18}
                        color={C.primary}
                      />
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: C.textSecondary, fontFamily: fontSemibold },
                        ]}
                      >
                        {t(language, "profile.birthDate")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: C.text, fontFamily: fontBold },
                      ]}
                    >
                      {meta.birth_day && meta.birth_month && meta.birth_year
                        ? `${meta.birth_day}/${meta.birth_month}/${meta.birth_year}`
                        : t(language, "profile.notSet")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoRow,
                      {
                        backgroundColor: C.surfaceHighlight,
                        flexDirection: isRTL ? "row-reverse" : "row",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.infoLeft,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          meta.gender === "male"
                            ? "gender-male"
                            : meta.gender === "female"
                              ? "gender-female"
                              : "gender-male-female"
                        }
                        size={18}
                        color={C.primary}
                      />
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: C.textSecondary, fontFamily: fontSemibold },
                        ]}
                      >
                        {t(language, "profile.gender")}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: C.text, fontFamily: fontBold },
                      ]}
                    >
                      {meta.gender === "male"
                        ? t(language, "profile.male")
                        : meta.gender === "female"
                          ? t(language, "profile.female")
                          : t(language, "profile.notSet")}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Stats Summary */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: C.textSecondary,
                    fontFamily: fontBold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t(language, "profile.statsOverview")}
              </Text>
              <View
                style={[
                  styles.statsGrid,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: C.surfaceHighlight },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trophy"
                    size={32}
                    color={C.level}
                  />
                  <Text
                    style={[
                      styles.statValue,
                      { color: C.text, fontFamily: fontBlack },
                    ]}
                  >
                    {gameState.level}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: C.textSecondary, fontFamily: fontRegular },
                    ]}
                  >
                    {t(language, "profile.level")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: C.surfaceHighlight },
                  ]}
                >
                  <MaterialCommunityIcons name="star" size={32} color={C.xp} />
                  <Text
                    style={[
                      styles.statValue,
                      { color: C.text, fontFamily: fontBlack },
                    ]}
                  >
                    {gameState.xp}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: C.textSecondary, fontFamily: fontRegular },
                    ]}
                  >
                    {t(language, "profile.totalXP")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: C.surfaceHighlight },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="fire"
                    size={32}
                    color={C.streak}
                  />
                  <Text
                    style={[
                      styles.statValue,
                      { color: C.text, fontFamily: fontBlack },
                    ]}
                  >
                    {gameState.currentStreak}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: C.textSecondary, fontFamily: fontRegular },
                    ]}
                  >
                    {t(language, "profile.dayStreak")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: C.surfaceHighlight },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={32}
                    color={C.success}
                  />
                  <Text
                    style={[
                      styles.statValue,
                      { color: C.text, fontFamily: fontBlack },
                    ]}
                  >
                    {totalStats}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: C.textSecondary, fontFamily: fontRegular },
                    ]}
                  >
                    {t(language, "profile.totalStats")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detailed Stats */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: C.textSecondary,
                    fontFamily: fontBold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t(language, "profile.attributes")}
              </Text>
              <View style={styles.attributesList}>
                <View
                  style={[
                    styles.attributeRow,
                    {
                      backgroundColor: C.surfaceHighlight,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.attributeLeft,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="arm-flex"
                      size={20}
                      color={C.strength}
                    />
                    <Text
                      style={[
                        styles.attributeName,
                        { color: C.text, fontFamily: fontSemibold },
                      ]}
                    >
                      {t(language, "stats.strength")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.attributeValue,
                      { color: C.strength, fontFamily: fontBold },
                    ]}
                  >
                    {gameState.strength}
                  </Text>
                </View>
                <View
                  style={[
                    styles.attributeRow,
                    {
                      backgroundColor: C.surfaceHighlight,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.attributeLeft,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="heart-pulse"
                      size={20}
                      color={C.endurance}
                    />
                    <Text
                      style={[
                        styles.attributeName,
                        { color: C.text, fontFamily: fontSemibold },
                      ]}
                    >
                      {t(language, "stats.endurance")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.attributeValue,
                      { color: C.endurance, fontFamily: fontBold },
                    ]}
                  >
                    {gameState.endurance}
                  </Text>
                </View>
                <View
                  style={[
                    styles.attributeRow,
                    {
                      backgroundColor: C.surfaceHighlight,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.attributeLeft,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="meditation"
                      size={20}
                      color={C.discipline}
                    />
                    <Text
                      style={[
                        styles.attributeName,
                        { color: C.text, fontFamily: fontSemibold },
                      ]}
                    >
                      {t(language, "stats.discipline")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.attributeValue,
                      { color: C.discipline, fontFamily: fontBold },
                    ]}
                  >
                    {gameState.discipline}
                  </Text>
                </View>
                <View
                  style={[
                    styles.attributeRow,
                    {
                      backgroundColor: C.surfaceHighlight,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.attributeLeft,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="star-circle"
                      size={20}
                      color={C.level}
                    />
                    <Text
                      style={[
                        styles.attributeName,
                        { color: C.text, fontFamily: fontSemibold },
                      ]}
                    >
                      {t(language, "profile.skillPoints")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.attributeValue,
                      { color: C.level, fontFamily: fontBold },
                    ]}
                  >
                    {gameState.skillPoints}
                  </Text>
                </View>
              </View>
            </View>

            {/* Milestones & Rewards */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: C.textSecondary,
                    fontFamily: fontBold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t(language, "profile.milestones")}
              </Text>
              <ScrollView style={styles.milestonesScroll} nestedScrollEnabled>
                <View style={styles.milestonesList}>
                  {MILESTONES.map((m) => {
                    const unlocked = gameState.level >= m.level;
                    return (
                      <View
                        key={m.level}
                        style={[
                          styles.milestoneRow,
                          {
                            backgroundColor: C.surfaceHighlight,
                            flexDirection: isRTL ? "row-reverse" : "row",
                          },
                          unlocked && {
                            borderColor: C.gold,
                            borderWidth: 1,
                            backgroundColor: `${C.gold}08`,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.milestoneRank,
                            {
                              backgroundColor: unlocked ? C.gold : C.textMuted,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.milestoneRankText,
                              { fontFamily: fontBold },
                            ]}
                          >
                            {m.level}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.milestoneIconCircle,
                            {
                              backgroundColor: unlocked
                                ? `${C.gold}22`
                                : `${C.textSecondary}15`,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={m.icon as any}
                            size={22}
                            color={unlocked ? C.gold : C.textSecondary}
                          />
                        </View>
                        <View
                          style={[
                            styles.milestoneInfo,
                            { alignItems: isRTL ? "flex-end" : "flex-start" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.milestoneName,
                              {
                                color: unlocked ? C.text : C.textSecondary,
                                fontFamily: fontSemibold,
                                textAlign: isRTL ? "right" : "left",
                              },
                            ]}
                          >
                            {t(language, m.titleKey)}
                          </Text>
                          <Text
                            style={[
                              styles.milestoneXP,
                              {
                                color: unlocked ? C.gold : C.textMuted,
                                fontFamily: fontRegular,
                                textAlign: isRTL ? "right" : "left",
                              },
                            ]}
                          >
                            +{m.amount} XP
                          </Text>
                        </View>
                        {unlocked ? (
                          <View
                            style={[
                              styles.milestoneBadge,
                              { backgroundColor: `${C.success}22` },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="check"
                              size={16}
                              color={C.success}
                            />
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.milestoneBadge,
                              { backgroundColor: `${C.textMuted}15` },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="lock"
                              size={16}
                              color={C.textMuted}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Leaderboard */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <TouchableOpacity
                style={[
                  styles.leaderboardButton,
                  { backgroundColor: `${C.level}18`, borderColor: C.level },
                ]}
                onPress={() => router.push("/leaderboard")}
              >
                <MaterialCommunityIcons
                  name="trophy"
                  size={20}
                  color={C.level}
                />
                <Text
                  style={[styles.leaderboardButtonText, { color: C.level }]}
                >
                  {t(language, "profile.viewLeaderboard")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account Actions */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={confirmReset}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={C.warning}
                />
                <Text style={styles.resetButtonText}>
                  {t(language, "profile.resetProgress")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSignOut}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color={C.error}
                />
                <Text style={styles.actionButtonText}>
                  {t(language, "profile.signOut")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <View style={[styles.section, { backgroundColor: C.surface }]}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDelete}
              >
                <MaterialCommunityIcons
                  name="account-remove"
                  size={20}
                  color="#991B1B"
                />
                <Text style={styles.deleteButtonText}>
                  {t(language, "profile.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      <ConfirmationBottomSheet
        visible={resetSheetOpen}
        title={t(language, "profile.resetTitle")}
        message={t(language, "profile.resetMessage")}
        confirmText={t(language, "profile.resetConfirm")}
        cancelText={t(language, "common.cancel")}
        confirmColor={Colors.warning}
        icon="refresh"
        iconColor={Colors.warning}
        onConfirm={handleResetProgress}
        onClose={() => setResetSheetOpen(false)}
      />

      <ConfirmationBottomSheet
        visible={deleteSheetOpen}
        title={t(language, "profile.deleteTitle")}
        message={t(language, "profile.deleteMessage")}
        confirmText={t(language, "profile.deleteConfirm")}
        cancelText={t(language, "common.cancel")}
        confirmColor={Colors.error}
        icon="account-remove"
        iconColor={Colors.error}
        onConfirm={handleDeleteAccount}
        onClose={() => setDeleteSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stickyTopBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "web" ? Spacing.md : 50,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 3,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  main: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: Spacing.sm,
    zIndex: 1,
  },
  section: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {
    marginBottom: Spacing.sm,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  email: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  accountAge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: Spacing.xl,
  },
  dangerSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.error,
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.title,
    fontWeight: "900",
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  attributesList: {
    gap: Spacing.md,
  },
  attributeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  attributeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  attributeName: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.text,
  },
  attributeValue: {
    fontSize: FontSize.xl,
    fontWeight: "900",
  },
  leaderboardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: Colors.level,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  leaderboardButtonText: {
    color: Colors.level,
    fontSize: FontSize.base,
    fontWeight: "700",
    letterSpacing: 1,
  },
  milestonesList: {
    gap: Spacing.sm,
  },
  milestonesScroll: {
    maxHeight: 400,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  milestoneRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneRankText: {
    color: "#fff",
    fontSize: FontSize.xs,
    fontWeight: "900",
  },
  milestoneIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: FontSize.base,
    fontWeight: "700",
  },
  milestoneXP: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    marginTop: 2,
  },
  milestoneBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: Colors.warning,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resetButtonText: {
    color: Colors.warning,
    fontSize: FontSize.base,
    fontWeight: "700",
    letterSpacing: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(153, 27, 27, 0.25)",
    borderWidth: 1,
    borderColor: "#991B1B",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  deleteButtonText: {
    color: "#991B1B",
    fontSize: FontSize.base,
    fontWeight: "700",
    letterSpacing: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: Colors.error,
    fontSize: FontSize.base,
    fontWeight: "700",
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingText: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: FontSize.base,
    fontWeight: "700",
  },
  editForm: {
    gap: Spacing.md,
  },
  dobRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  editLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  cancelEditButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  editActionsRow: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  editActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "visible" as const,
  },
});
