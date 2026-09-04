import { useState } from "react";
import {
  Modal as NativeModal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarDays, X } from "lucide-react-native";
import { Button, IconButton, Label } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colorString,
  colors,
  radius,
  shadowLg,
  space,
} from "@/constants/theme";

export function DateField({
  label,
  value,
  onChange,
  optional = false,
  hint,
  error,
  maximumDate,
  minimumDate,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  optional?: boolean;
  hint?: string;
  error?: string | null;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? new Date());
  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "ios") {
      if (date) setDraft(date);
      return;
    }
    setOpen(false);
    if (event.type === "set" && date) onChange(date);
  };
  const openPicker = () => {
    setDraft(value ?? new Date());
    setOpen(true);
  };
  const formatted = value
    ? value.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : optional
      ? "No date"
      : "Choose a date";
  return (
    <View style={styles.wrapper}>
      <Label>{label}</Label>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatted}`}
          accessibilityHint="Opens the date picker"
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [
            styles.control,
            Boolean(error) && styles.controlError,
            pressed && styles.pressed,
          ]}
          onPress={openPicker}
        >
          <CalendarDays
            accessible={false}
            color={colorString(colors.muted)}
            size={18}
          />
          <Text style={[styles.text, !value && styles.placeholder]}>
            {formatted}
          </Text>
        </Pressable>
        {optional && value && (
          <IconButton
            icon={X}
            label={`Clear ${label}`}
            onPress={() => onChange(null)}
          />
        )}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
      {open && Platform.OS !== "ios" && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            accessibilityLabel={label}
            value={value ?? new Date()}
            mode="date"
            display="default"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        </View>
      )}
      {Platform.OS === "ios" && (
        <NativeModal
          transparent
          visible={open}
          animationType="none"
          presentationStyle="overFullScreen"
          onRequestClose={() => setOpen(false)}
        >
          <View accessibilityViewIsModal style={styles.modalRoot}>
            <View accessible={false} style={styles.modalBackdrop} />
            <SafeAreaView edges={["bottom"]} style={styles.modalSurface}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeading}>
                  <Label tone="accent">Choose date</Label>
                  <Text accessibilityRole="header" style={styles.modalTitle}>
                    {label}
                  </Text>
                </View>
                <IconButton
                  icon={X}
                  label={`Close ${label} picker`}
                  onPress={() => setOpen(false)}
                />
              </View>
              <DateTimePicker
                accessibilityLabel={label}
                value={draft}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={handleChange}
              />
              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  tone="ghost"
                  inline
                  onPress={() => setOpen(false)}
                />
                <Button
                  title="Done"
                  tone="accent"
                  style={styles.modalDone}
                  onPress={() => {
                    onChange(draft);
                    setOpen(false);
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
        </NativeModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  control: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
  },
  controlError: { borderColor: colors.bad, backgroundColor: colors.badSoft },
  text: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: "600" },
  placeholder: { color: colors.muted, fontWeight: "500" },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  error: { color: colors.bad, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    overflow: "hidden",
  },
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: colors.overlay,
  },
  modalSurface: {
    width: "100%",
    maxWidth: 560,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.md,
    ...shadowLg,
  },
  modalHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
  },
  modalHeading: { flex: 1, gap: 3 },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  modalDone: { flex: 1 },
  pressed: { opacity: 0.7 },
});
