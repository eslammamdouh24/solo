import { BorderRadius, FontSize, Spacing } from "@/constants/theme-colors";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownPickerProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
  isRTL?: boolean;
}

export function DropdownPicker({
  options,
  value,
  onSelect,
  placeholder,
  disabled = false,
  hasError = false,
  isRTL = false,
}: DropdownPickerProps) {
  const C = useColors();
  const { theme } = useApp();

  const listBg = theme === "light" ? "#FFFFFF" : "#151A2E";
  const activeItemBg = theme === "light" ? `${C.primary}15` : `${C.primary}18`;
  const hoverBg =
    theme === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";
  const dropdownRef = useRef<any>(null);

  return (
    <Pressable style={{ flex: 1 }} onPress={() => dropdownRef.current?.open()}>
      <Dropdown
        ref={dropdownRef}
        data={options}
        labelField="label"
        valueField="value"
        value={value}
        onChange={(item) => onSelect(item.value)}
        placeholder={placeholder}
        disable={disabled}
        style={[
          styles.dropdown,
          {
            backgroundColor: C.surfaceHighlight,
            borderColor: hasError ? "#EF4444" : C.surface,
            borderWidth: hasError ? 2 : 1,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
        placeholderStyle={[
          styles.placeholderStyle,
          {
            color: C.textSecondary,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        selectedTextStyle={[
          styles.selectedTextStyle,
          {
            color: C.text,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        containerStyle={[
          styles.listContainer,
          {
            backgroundColor: listBg,
            borderColor:
              theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
          },
        ]}
        itemContainerStyle={[
          styles.itemContainer,
          { backgroundColor: hoverBg },
        ]}
        itemTextStyle={[
          styles.itemText,
          {
            color: C.text,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
        activeColor={activeItemBg}
        iconColor={C.textSecondary}
        maxHeight={240}
        showsVerticalScrollIndicator={false}
        autoScroll={false}
        renderRightIcon={() => (
          <View style={{ paddingLeft: Spacing.sm }}>
            <MaterialCommunityIcons
              name="chevron-down"
              size={16}
              color={C.textSecondary}
            />
          </View>
        )}
        renderItem={(item, selected) => (
          <View
            style={[
              styles.item,
              {
                backgroundColor: selected ? activeItemBg : "transparent",
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <Text
              style={[
                styles.itemText,
                {
                  color: selected ? C.primary : C.text,
                  fontWeight: selected ? "700" : "400",
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {item.label}
            </Text>
            {selected && (
              <MaterialCommunityIcons
                name="check"
                size={14}
                color={C.primary}
              />
            )}
          </View>
        )}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    flex: 1,
    alignItems: "center",
  },
  placeholderStyle: {
    fontSize: FontSize.sm,
  },
  selectedTextStyle: {
    fontSize: FontSize.sm,
  },
  listContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
        }
      : {
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        }),
  },
  itemContainer: {
    borderRadius: 0,
  },
  item: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
});
