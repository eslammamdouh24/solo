import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
} from "@expo-google-fonts/cairo";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { FloatingTimer } from "@/components/FloatingTimer";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext";
import { FloatingTimerProvider } from "@/contexts/FloatingTimerContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { SideDrawerProvider } from "@/contexts/SideDrawerContext";
import { SyncQueueProvider } from "@/contexts/SyncQueueContext";
import { useColors } from "@/hooks/useColors";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// Inject global CSS for web: scrollbar + autofill fix
if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    /* Firefox */
    * {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.15) rgba(255, 255, 255, 0.03);
    }
    /* Remove autofill background color */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active,
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus,
    textarea:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important;
      -webkit-text-fill-color: #FFFFFF !important;
      transition: background-color 5000s ease-in-out 0s;
      caret-color: #FFFFFF;
    }
    /* Prevent pointer events leaking into aria-hidden screens */
    [aria-hidden="true"] * {
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  // Blur the active element when an ancestor becomes aria-hidden, so focus
  // is not retained inside a hidden subtree (accessibility violation).
  const blurIfHidden = () => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) return;
    let el: HTMLElement | null = active;
    while (el) {
      if (el.getAttribute && el.getAttribute("aria-hidden") === "true") {
        active.blur();
        return;
      }
      el = el.parentElement;
    }
  };
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "aria-hidden") {
        blurIfHidden();
        return;
      }
    }
  });
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ["aria-hidden"],
  });
}

function RootLayoutNav() {
  const { user, loading, signInInProgress, isPasswordRecovery } = useAuth();
  const C = useColors();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Don't redirect while sign-in validation is in progress
    if (signInInProgress) return;

    const inAuthGroup = segments[0] === "auth";

    // If in password recovery mode, always show auth screen
    if (isPasswordRecovery && !inAuthGroup) {
      router.replace("/auth");
      return;
    }

    if (!user && !inAuthGroup) {
      // Redirect to auth screen if not logged in
      router.replace("/auth");
    } else if (user && inAuthGroup && !isPasswordRecovery) {
      // Redirect to main app if logged in (but NOT during password recovery)
      router.replace("/");
    }
  }, [user, loading, segments, signInInProgress, isPasswordRecovery]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: C.background,
        }}
      >
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS === "web"
          ? { animation: "none", freezeOnBlur: true }
          : { animation: "slide_from_right", animationDuration: 280 }),
      }}
    >
      <Stack.Screen name="auth" />
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="exercise-list" />
      <Stack.Screen name="exercise-detail" />
    </Stack>
  );
}

function ThemedApp() {
  const { theme } = useApp();

  return (
    <AuthProvider>
      <FloatingTimerProvider>
        <SideDrawerProvider>
          <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
            <View
              style={[
                webStyles.outerContainer,
                { backgroundColor: theme === "light" ? "#E2E8F0" : "#050816" },
              ]}
            >
              <View
                style={[
                  webStyles.appContainer,
                  {
                    borderColor:
                      theme === "light"
                        ? "rgba(0,0,0,0.08)"
                        : "rgba(255, 255, 255, 0.06)",
                    overflow: "hidden",
                  },
                ]}
              >
                <RootLayoutNav />
                <FloatingTimer />
              </View>
            </View>
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
          </ThemeProvider>
        </SideDrawerProvider>
      </FloatingTimerProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A0E27",
        }}
      >
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkProvider>
        <AppProvider>
          <SyncQueueProvider>
            <ConfirmDialogProvider>
              <ThemedApp />
            </ConfirmDialogProvider>
          </SyncQueueProvider>
        </AppProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#050816",
  },
  appContainer: {
    flex: 1,
    width: Platform.OS === "web" ? "60%" : "100%",
    maxWidth: Platform.OS === "web" ? 540 : undefined,
    minWidth: Platform.OS === "web" ? 360 : undefined,
    ...(Platform.OS === "web"
      ? {
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.06)",
        }
      : {}),
  },
});
