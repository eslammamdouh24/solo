import { Colors } from "@/constants/colors";
import { Language, Theme, isRTL as checkRTL } from "@/constants/enums";
import { FontSize } from "@/constants/font-size";
import { getFont } from "@/constants/fonts";
import { BorderRadius, Spacing } from "@/constants/spacing";
import { t } from "@/constants/translations";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const DRAWER_WIDTH = 300;

interface DrawerCtx {
  open: () => void;
  close: () => void;
  visible: boolean;
}

const SideDrawerContext = createContext<DrawerCtx>({
  open: () => {},
  close: () => {},
  visible: false,
});

export const useSideDrawer = () => useContext(SideDrawerContext);

export const SideDrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <SideDrawerContext.Provider value={{ open, close, visible }}>
      {children}
      <SideDrawer visible={visible} onClose={close} />
    </SideDrawerContext.Provider>
  );
};

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

function SideDrawer({ visible, onClose }: SideDrawerProps) {
  const { theme, language, toggleTheme, setLanguage } = useApp();
  const { user, isAdmin, signOut } = useAuth();
  const C = useColors();
  const router = useRouter();
  const isRTL = checkRTL(language);
  const fontBold = getFont(language, "bold");
  const fontSemibold = getFont(language, "semibold");

  const translateX = useRef(
    new Animated.Value(isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH),
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Keep Modal mounted during close animation
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    const closedValue = isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH;
    if (visible) {
      setRendered(true);
      translateX.setValue(closedValue);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: closedValue,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isRTL]);

  const go = (path: string) => {
    onClose();
    // slight delay so animation completes smoothly
    setTimeout(() => router.push(path as any), 220);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.replace("/auth");
  };

  const username =
    user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const profileImage: string | null =
    user?.user_metadata?.profile_image || null;

  const menuItems: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
    adminOnly?: boolean;
  }[] = [
    {
      icon: "account-circle",
      label: t(language, "nav.profile") || "Profile",
      onPress: () => go("/profile"),
    },
    {
      icon: "view-dashboard",
      label: t(language, "nav.dashboard") || "Dashboard",
      onPress: () => go("/"),
    },
    {
      icon: "trophy",
      label: t(language, "nav.leaderboard") || "Leaderboard",
      onPress: () => go("/leaderboard"),
    },
    {
      icon: "shield-crown",
      label: t(language, "nav.admin") || "Admin Dashboard",
      onPress: () => go("/admin"),
      adminOnly: true,
    },
  ];

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.5)", opacity: overlayOpacity },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            isRTL ? styles.drawerRight : styles.drawerLeft,
            {
              backgroundColor: C.background,
              borderColor: C.border,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Header: user info */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => go("/profile")}
            style={[
              styles.header,
              {
                borderBottomColor: C.border,
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: C.primary + "20", borderColor: C.primary },
              ]}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text
                  style={[
                    styles.avatarText,
                    { color: C.primary, fontFamily: fontBold },
                  ]}
                >
                  {username.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View
              style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}
            >
              <Text
                style={[
                  styles.username,
                  { color: C.text, fontFamily: fontBold },
                ]}
                numberOfLines={1}
              >
                {username}
              </Text>
              {email ? (
                <Text
                  style={[styles.email, { color: C.textMuted }]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              ) : null}
              {isAdmin && (
                <View
                  style={[
                    styles.adminBadge,
                    { backgroundColor: C.gold + "20", borderColor: C.gold },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={11}
                    color={C.gold}
                  />
                  <Text style={[styles.adminBadgeText, { color: C.gold }]}>
                    ADMIN
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Menu */}
          <ScrollView
            style={styles.menu}
            contentContainerStyle={{ paddingVertical: Spacing.sm }}
          >
            {menuItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={22}
                    color={C.primary}
                  />
                  <Text
                    style={[
                      styles.menuLabel,
                      { color: C.text, fontFamily: fontSemibold },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {/* Language toggle (switch) */}
            <View
              style={[
                styles.toggleRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View
                style={[
                  styles.toggleLeft,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <MaterialCommunityIcons
                  name="translate"
                  size={22}
                  color={C.primary}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: C.text, fontFamily: fontSemibold },
                  ]}
                >
                  {t(language, "settings.language") || "Language"}
                </Text>
              </View>
              <View
                style={[
                  styles.segment,
                  {
                    borderColor: C.border,
                    backgroundColor: C.surfaceHighlight,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    language === Language.EN && { backgroundColor: C.primary },
                  ]}
                  onPress={() => {
                    if (language !== Language.EN) {
                      setLanguage(Language.EN);
                      onClose();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          language === Language.EN ? "#000" : C.textSecondary,
                        fontFamily: fontSemibold,
                      },
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    language === Language.AR && { backgroundColor: C.primary },
                  ]}
                  onPress={() => {
                    if (language !== Language.AR) {
                      setLanguage(Language.AR);
                      onClose();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          language === Language.AR ? "#000" : C.textSecondary,
                        fontFamily: fontSemibold,
                      },
                    ]}
                  >
                    AR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme toggle (segmented) */}
            <View
              style={[
                styles.toggleRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View
                style={[
                  styles.toggleLeft,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    theme === Theme.DARK ? "weather-night" : "weather-sunny"
                  }
                  size={22}
                  color={C.primary}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: C.text, fontFamily: fontSemibold },
                  ]}
                >
                  {t(language, "settings.theme") || "Theme"}
                </Text>
              </View>
              <View
                style={[
                  styles.segment,
                  {
                    borderColor: C.border,
                    backgroundColor: C.surfaceHighlight,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    theme === Theme.LIGHT && { backgroundColor: C.primary },
                  ]}
                  onPress={() => theme !== Theme.LIGHT && toggleTheme()}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="weather-sunny"
                    size={16}
                    color={theme === Theme.LIGHT ? "#000" : C.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    theme === Theme.DARK && { backgroundColor: C.primary },
                  ]}
                  onPress={() => theme !== Theme.DARK && toggleTheme()}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="weather-night"
                    size={16}
                    color={theme === Theme.DARK ? "#000" : C.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {/* Sign out */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.signOutItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="logout"
                size={22}
                color={Colors.error}
              />
              <Text
                style={[
                  styles.menuLabel,
                  { color: Colors.error, fontFamily: fontSemibold },
                ]}
              >
                {t(language, "profile.signOut") || "Sign Out"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    maxWidth: Dimensions.get("window").width * 0.85,
  },
  drawerLeft: {
    left: 0,
    borderRightWidth: 1,
  },
  drawerRight: {
    right: 0,
    borderLeftWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingTop: Spacing.xl + Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: "800",
  },
  username: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  email: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginVertical: 2,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  signOutItem: {
    marginVertical: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    // Preserve icon alignment with other rows (outer margin + inner padding = Spacing.sm + Spacing.md)
    paddingHorizontal: Spacing.sm + Spacing.md,
  },
  menuLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    flex: 1,
  },
  menuValue: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  switchLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    minWidth: 22,
    textAlign: "center",
  },
  segment: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    padding: 2,
    gap: 2,
  },
  segmentBtn: {
    minWidth: 40,
    height: 28,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm - 2,
  },
  segmentText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  toggleRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginVertical: 2,
    marginHorizontal: Spacing.sm,
    gap: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  toggleLeft: {
    alignItems: "center",
    gap: Spacing.md,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
    marginHorizontal: Spacing.md,
  },
});
