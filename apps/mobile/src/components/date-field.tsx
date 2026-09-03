import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Label } from "@/components/ui";
import { colors } from "@/constants/theme";

export function DateField({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  optional?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "set" && date) onChange(date);
  };
  const formatted = value
    ? value.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No date";
  return (
    <View style={styles.wrapper}>
      <Label>{label}</Label>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatted}`}
          accessibilityHint="Opens the date picker"
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}
          onPress={() => setOpen(true)}
        >
          <Text style={styles.text}>{formatted}</Text>
        </Pressable>
        {optional && value && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={8}
            onPress={() => onChange(null)}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <Text style={styles.clearText}>CLEAR</Text>
          </Pressable>
        )}
      </View>
      {open && (
        <DateTimePicker
          accessibilityLabel={label}
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleChange}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: "row", gap: 8 },
  control: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  text: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  clear: {
    minWidth: 54,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: { color: colors.red, fontSize: 10, fontWeight: "700" },
  pressed: { opacity: 0.6 },
});
