import { DropdownPicker } from "@/components/DropdownPicker";
import { Toast } from "@/components/Toast";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  fullName?: string;
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  dob?: string;
  gender?: string;
}

export default function AuthScreen() {
  const { language } = useApp();
  const C = useColors();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info",
  );
  const { signIn, signUp, resetPassword } = useAuth();
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

  // Custom circular spinner animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (loading) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        }),
      ).start();
    }
  }, [loading, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});
    const newErrors: ValidationErrors = {};

    if (!email.trim()) {
      newErrors.email = t(language, "auth.emailRequired");
    } else if (isSignUp || isForgotPassword) {
      // Only validate email format for sign up and forgot password
      if (!validateEmail(email)) {
        newErrors.email = t(language, "auth.emailInvalid");
      }
    }

    // Validate username for sign up
    if (isSignUp && !isForgotPassword) {
      if (!username.trim()) {
        newErrors.username = t(language, "auth.usernameRequired");
      } else if (username.trim().length < 3) {
        newErrors.username = t(language, "auth.usernameMinLength");
      }
      if (!fullName.trim()) {
        newErrors.fullName = t(language, "auth.nameRequired");
      }
      // Validate date of birth
      if (!birthDay.trim() || !birthMonth.trim() || !birthYear.trim()) {
        newErrors.dob = t(language, "auth.ageRequired");
      } else {
        const day = parseInt(birthDay, 10);
        const month = parseInt(birthMonth, 10);
        const year = parseInt(birthYear, 10);
        const now = new Date();
        const birthDate = new Date(year, month - 1, day);
        if (
          isNaN(day) ||
          isNaN(month) ||
          isNaN(year) ||
          day < 1 ||
          day > 31 ||
          month < 1 ||
          month > 12 ||
          year < 1900 ||
          year > now.getFullYear() ||
          birthDate.getDate() !== day ||
          birthDate.getMonth() !== month - 1
        ) {
          newErrors.dob = t(language, "auth.ageInvalid");
        } else {
          const ageDiff = now.getFullYear() - year;
          const monthDiff = now.getMonth() - (month - 1);
          const dayDiff = now.getDate() - day;
          const calculatedAge =
            monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)
              ? ageDiff - 1
              : ageDiff;
          if (calculatedAge < 13 || calculatedAge > 100) {
            newErrors.dob = t(language, "auth.ageInvalid");
          }
        }
      }
      if (!gender) {
        newErrors.gender = t(language, "auth.genderRequired");
      }
    }

    // Skip password validation for forgot password
    if (!isForgotPassword) {
      if (!password) {
        newErrors.password = t(language, "auth.passwordRequired");
      } else if (password.length < 8) {
        newErrors.password = t(language, "auth.passwordMinLength");
      }

      if (isSignUp && password !== confirmPassword) {
        newErrors.confirmPassword = t(language, "auth.passwordMismatch");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (isForgotPassword) {
        await resetPassword(email.trim().toLowerCase());
        setLoading(false);
        showToast(t(language, "auth.resetEmailSent"), "success");
        setIsForgotPassword(false);
        setEmail("");
        setErrors({});
      } else if (isSignUp) {
        await signUp(email.trim().toLowerCase(), password, username.trim(), {
          fullName: fullName.trim(),
          birthDay: parseInt(birthDay, 10),
          birthMonth: parseInt(birthMonth, 10),
          birthYear: parseInt(birthYear, 10),
          gender,
        });
        setLoading(false);
        showToast(t(language, "auth.accountCreated"), "success");
        // Redirect to sign in after successful signup
        setIsSignUp(false);
        setPassword("");
        setConfirmPassword("");
        setUsername("");
        setFullName("");
        setBirthDay("");
        setBirthMonth("");
        setBirthYear("");
        setGender("");
        setErrors({});
      } else {
        // Sign in - show loading progress screen after successful sign in
        await signIn(email.trim().toLowerCase(), password);
        // Only set loading progress if sign in succeeds (no error thrown)
        setLoadingProgress(true);
        // Keep loading=true while showing loading progress screen
      }
    } catch (error: any) {
      // Reset both loading states on error
      setLoading(false);
      setLoadingProgress(false);
      const errorMessage = error.message || t(language, "auth.errorOccurred");
      // Better error messages for common cases
      if (errorMessage.includes("USER_ALREADY_REGISTERED")) {
        showToast(t(language, "auth.emailAlreadyRegistered"), "error");
        setIsSignUp(false);
        setPassword("");
        setErrors({});
      } else if (
        errorMessage.includes("Invalid login credentials") ||
        errorMessage.includes("Invalid email or password")
      ) {
        showToast(t(language, "auth.invalidCredentials"), "error");
      } else if (errorMessage.includes("Email not confirmed")) {
        showToast(t(language, "auth.emailNotVerified"), "error");
      } else if (errorMessage.includes("User not found")) {
        showToast(t(language, "auth.accountNotFound"), "error");
      } else {
        showToast(errorMessage, "error");
      }
    }
  };

  // Show loading progress screen after successful sign in
  if (loadingProgress) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: C.background }]}
      >
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.loadingText, { color: C.textSecondary }]}>
          {t(language, "auth.loadingProgress")}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: C.background }]}
    >
      {/* Sticky TopBar */}
      <View
        style={[
          styles.stickyTopBar,
          {
            backgroundColor: C.background,
          },
        ]}
      >
        <TopBar hideLogo />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: C.primary, fontFamily: fontBlack },
              ]}
            >
              SOLO
            </Text>
            <Text
              style={[
                styles.slogan,
                { color: C.gold, fontFamily: fontSemibold },
              ]}
            >
              {t(language, "auth.slogan")}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: C.textSecondary, fontFamily: fontSemibold },
              ]}
            >
              {isForgotPassword
                ? t(language, "auth.resetPassword")
                : isSignUp
                  ? t(language, "auth.createAccount")
                  : t(language, "auth.welcomeBack")}
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError,
                  {
                    backgroundColor: C.surfaceHighlight,
                    color: C.text,
                    borderColor: C.surface,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={
                  isSignUp || isForgotPassword
                    ? t(language, "auth.email")
                    : t(language, "auth.emailOrUsername")
                }
                placeholderTextColor={C.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                autoCapitalize="none"
                keyboardType={isSignUp ? "email-address" : "default"}
                editable={!loading}
                autoComplete={isSignUp ? "email" : "username"}
              />
              {errors.email && (
                <Text
                  style={[
                    styles.errorText,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {errors.email}
                </Text>
              )}
            </View>

            {isSignUp && !isForgotPassword && (
              <>
                <View>
                  <TextInput
                    style={[
                      styles.input,
                      errors.fullName && styles.inputError,
                      {
                        backgroundColor: C.surfaceHighlight,
                        color: C.text,
                        borderColor: C.surface,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    placeholder={t(language, "auth.fullName")}
                    placeholderTextColor={C.textSecondary}
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (errors.fullName)
                        setErrors({ ...errors, fullName: undefined });
                    }}
                    editable={!loading}
                    autoComplete="name"
                  />
                  {errors.fullName && (
                    <Text
                      style={[
                        styles.errorText,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {errors.fullName}
                    </Text>
                  )}
                </View>

                <View>
                  <TextInput
                    style={[
                      styles.input,
                      errors.username && styles.inputError,
                      {
                        backgroundColor: C.surfaceHighlight,
                        color: C.text,
                        borderColor: C.surface,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    placeholder={t(language, "auth.username")}
                    placeholderTextColor={C.textSecondary}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errors.username)
                        setErrors({ ...errors, username: undefined });
                    }}
                    autoCapitalize="none"
                    editable={!loading}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <Text
                      style={[
                        styles.errorText,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {errors.username}
                    </Text>
                  )}
                </View>

                <View>
                  <Text
                    style={[
                      styles.dobLabel,
                      {
                        color: C.textSecondary,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {t(language, "auth.age")}
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
                        value={birthDay}
                        onSelect={(v) => {
                          setBirthDay(v);
                          if (errors.dob)
                            setErrors({ ...errors, dob: undefined });
                        }}
                        placeholder={t(language, "auth.birthDay")}
                        disabled={loading}
                        hasError={!!errors.dob}
                        isRTL={isRTL}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <DropdownPicker
                        options={monthOptions}
                        value={birthMonth}
                        onSelect={(v) => {
                          setBirthMonth(v);
                          if (errors.dob)
                            setErrors({ ...errors, dob: undefined });
                        }}
                        placeholder={t(language, "auth.birthMonth")}
                        disabled={loading}
                        hasError={!!errors.dob}
                        isRTL={isRTL}
                      />
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <DropdownPicker
                        options={yearOptions}
                        value={birthYear}
                        onSelect={(v) => {
                          setBirthYear(v);
                          if (errors.dob)
                            setErrors({ ...errors, dob: undefined });
                        }}
                        placeholder={t(language, "auth.birthYear")}
                        disabled={loading}
                        hasError={!!errors.dob}
                        isRTL={isRTL}
                      />
                    </View>
                  </View>
                  {errors.dob && (
                    <Text
                      style={[
                        styles.errorText,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {errors.dob}
                    </Text>
                  )}
                </View>

                <View>
                  <View
                    style={[
                      styles.genderContainer,
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
                        gender === "male" && {
                          borderColor: C.primary,
                          backgroundColor: `${C.primary}22`,
                        },
                      ]}
                      onPress={() => {
                        setGender("male");
                        if (errors.gender)
                          setErrors({ ...errors, gender: undefined });
                      }}
                      disabled={loading}
                    >
                      <MaterialCommunityIcons
                        name="gender-male"
                        size={20}
                        color={gender === "male" ? C.primary : C.textSecondary}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color:
                              gender === "male" ? C.primary : C.textSecondary,
                          },
                        ]}
                      >
                        {t(language, "auth.genderMale")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderOption,
                        {
                          borderColor: C.surface,
                          backgroundColor: C.surfaceHighlight,
                        },
                        gender === "female" && {
                          borderColor: C.primary,
                          backgroundColor: `${C.primary}22`,
                        },
                      ]}
                      onPress={() => {
                        setGender("female");
                        if (errors.gender)
                          setErrors({ ...errors, gender: undefined });
                      }}
                      disabled={loading}
                    >
                      <MaterialCommunityIcons
                        name="gender-female"
                        size={20}
                        color={
                          gender === "female" ? C.primary : C.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          {
                            color:
                              gender === "female" ? C.primary : C.textSecondary,
                          },
                        ]}
                      >
                        {t(language, "auth.genderFemale")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.gender && (
                    <Text
                      style={[
                        styles.errorText,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {errors.gender}
                    </Text>
                  )}
                </View>
              </>
            )}

            {!isForgotPassword && (
              <View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      isRTL ? styles.passwordInputRTL : styles.passwordInput,
                      errors.password && styles.inputError,
                      {
                        backgroundColor: C.surfaceHighlight,
                        color: C.text,
                        borderColor: C.surface,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    placeholder={t(language, "auth.password")}
                    placeholderTextColor={C.textSecondary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password)
                        setErrors({ ...errors, password: undefined });
                    }}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={[
                      styles.eyeButton,
                      { [isRTL ? "left" : "right"]: 0 },
                    ]}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color={C.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text
                    style={[
                      styles.errorText,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {errors.password}
                  </Text>
                )}
              </View>
            )}

            {!isForgotPassword && isSignUp && (
              <View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      isRTL ? styles.passwordInputRTL : styles.passwordInput,
                      errors.confirmPassword && styles.inputError,
                      {
                        backgroundColor: C.surfaceHighlight,
                        color: C.text,
                        borderColor: C.surface,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                    placeholder={t(language, "auth.confirmPassword")}
                    placeholderTextColor={C.textSecondary}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={[
                      styles.eyeButton,
                      { [isRTL ? "left" : "right"]: 0 },
                    ]}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color={C.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text
                    style={[
                      styles.errorText,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>
            )}

            {!isForgotPassword && !isSignUp && (
              <TouchableOpacity
                style={[
                  styles.rememberMeContainer,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: C.textSecondary },
                    rememberMe && {
                      backgroundColor: C.primary,
                      borderColor: C.primary,
                    },
                  ]}
                >
                  {rememberMe && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color="#fff"
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.rememberMeText,
                    { color: C.text, fontFamily: fontRegular },
                  ]}
                >
                  {t(language, "auth.rememberMe")}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: C.primary,
                  boxShadow: `0px 4px 8px ${C.primary}4D`,
                },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <View style={styles.buttonContent}>
                {loading && (
                  <Animated.View
                    style={[styles.spinner, { transform: [{ rotate: spin }] }]}
                  >
                    <View style={styles.spinnerInner} />
                  </Animated.View>
                )}
                <Text
                  style={[
                    styles.buttonText,
                    { color: "#fff", fontFamily: fontBold },
                  ]}
                >
                  {isForgotPassword
                    ? t(language, "auth.sendResetLink").toUpperCase()
                    : isSignUp
                      ? t(language, "auth.signUp").toUpperCase()
                      : t(language, "auth.signIn").toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>

            {!isForgotPassword && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => {
                  setIsForgotPassword(true);
                  setErrors({});
                  setEmail("");
                  setPassword("");
                }}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.forgotPasswordText,
                    { color: C.primary, fontFamily: fontSemibold },
                  ]}
                >
                  {t(language, "auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                setErrors({});
                setEmail("");
                setConfirmPassword("");
                setPassword("");
                setFullName("");
                setBirthDay("");
                setBirthMonth("");
                setBirthYear("");
                setGender("");
              }}
              disabled={loading}
            >
              <Text
                style={[
                  styles.switchText,
                  { color: C.textSecondary, fontFamily: fontRegular },
                ]}
              >
                {isForgotPassword
                  ? t(language, "auth.backToSignIn")
                  : isSignUp
                    ? t(language, "auth.haveAccount")
                    : t(language, "auth.noAccount")}
              </Text>
            </TouchableOpacity>
          </View>

          <Toast
            message={toastMessage}
            type={toastType}
            visible={toastVisible}
            onHide={() => setToastVisible(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xxl,
    minHeight: "100%",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  topBarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  topBarLang: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: FontSize.display,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: 8,
    marginBottom: Spacing.sm,
  },
  slogan: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 4,
  },
  form: {
    gap: Spacing.lg,
  },
  rowFields: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dobRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dobLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  genderContainer: {
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
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  genderText: {
    fontSize: FontSize.base,
    fontWeight: "600",
  },
  input: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  passwordContainer: {
    position: "relative" as const,
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordInputRTL: {
    paddingRight: undefined,
    paddingLeft: 50,
  },
  eyeButton: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    width: 50,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
    fontWeight: "600",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    boxShadow: "0px 4px 8px rgba(0, 229, 255, 0.3)",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: "700",
    letterSpacing: 2,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
  },
  spinnerInner: {
    // empty inner for the ring effect
  },
  switchButton: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
  },
  forgotPassword: {
    padding: Spacing.md,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: FontSize.base,
    fontWeight: "600",
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberMeText: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    gap: Spacing.lg,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },
  stickyTopBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "web" ? Spacing.md : 50,
    paddingBottom: Spacing.sm,
  },
});
