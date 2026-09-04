import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarDays, X } from "lucide-react-native";
import { IconButton, Label } from "@/components/ui";
import { colorString, colors, radius } from "@/constants/theme";

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
  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "set" && date) onChange(date);
    if (event.type === "dismissed") setOpen(false);
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
          onPress={() => setOpen((current) => !current)}
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
      {open && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            accessibilityLabel={label}
            value={value ?? new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        </View>
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
  pressed: { opacity: 0.7 },
});
