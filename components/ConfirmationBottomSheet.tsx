import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/constants/theme-colors";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Only import bottom-sheet on native
let BottomSheet: any;
let BottomSheetBackdrop: any;
let BottomSheetView: any;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bs = require("@gorhom/bottom-sheet");
  BottomSheet = bs.default;
  BottomSheetBackdrop = bs.BottomSheetBackdrop;
  BottomSheetView = bs.BottomSheetView;
}

interface ConfirmationBottomSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
}

/**
 * Confirmation dialog — BottomSheet on native, Modal on web.
 * Only mounts when `visible` is true.
 */
export function ConfirmationBottomSheet({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = Colors.error,
  onConfirm,
  onClose,
  icon = "alert-circle",
  iconColor = Colors.warning,
}: ConfirmationBottomSheetProps) {
  if (!visible) return null;

  if (Platform.OS === "web") {
    return (
      <WebModal
        visible={visible}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        confirmColor={confirmColor}
        onConfirm={onConfirm}
        onClose={onClose}
        icon={icon}
        iconColor={iconColor}
      />
    );
  }

  return (
    <NativeSheet
      visible={visible}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmColor={confirmColor}
      onConfirm={onConfirm}
      onClose={onClose}
      icon={icon}
      iconColor={iconColor}
    />
  );
}

/** Web: centered modal with backdrop */
function WebModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  confirmColor,
  onConfirm,
  onClose,
  icon,
  iconColor,
}: ConfirmationBottomSheetProps) {
  const C = useColors();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: C.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon!} size={48} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          <Text style={[styles.message, { color: C.textSecondary }]}>
            {message}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: C.surfaceHighlight,
                  borderColor: C.textMuted,
                },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: C.text }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: confirmColor }]}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Native: @gorhom/bottom-sheet */
function NativeSheet({
  title,
  message,
  confirmText,
  cancelText,
  confirmColor,
  onConfirm,
  onClose,
  icon,
  iconColor,
}: ConfirmationBottomSheetProps) {
  const C = useColors();
  const bottomSheetRef = useRef<any>(null);
  const snapPoints = useMemo(() => ["38%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const handleConfirm = () => {
    bottomSheetRef.current?.close();
    onConfirm();
  };

  const handleCancel = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onChange={handleSheetChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={[
        styles.bottomSheetBackground,
        { backgroundColor: C.background },
      ]}
      handleIndicatorStyle={[
        styles.handleIndicator,
        { backgroundColor: C.textSecondary },
      ]}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon!} size={48} color={iconColor} />
        </View>

        <Text style={[styles.title, { color: C.text }]}>{title}</Text>
        <Text style={[styles.message, { color: C.textSecondary }]}>
          {message}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { backgroundColor: C.surfaceHighlight, borderColor: C.textMuted },
            ]}
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: C.text }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: confirmColor }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // Web modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
  },
  // Native bottom sheet styles
  bottomSheetBackground: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handleIndicator: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.xxl,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: FontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: FontSize.base,
    fontWeight: "700",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.base,
    fontWeight: "700",
  },
});
