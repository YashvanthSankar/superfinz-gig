import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Label } from "@/components/ui";
import { colors } from "@/constants/theme";

export function DateField({ label, value, onChange, optional = false }: { label: string; value: Date | null; onChange: (date: Date | null) => void; optional?: boolean }) {
  const [open, setOpen] = useState(false);
  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "set" && date) onChange(date);
  };
  return <View style={styles.wrapper}><Label>{label}</Label><View style={styles.row}><Pressable style={styles.control} onPress={() => setOpen(true)}><Text style={styles.text}>{value ? value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No date"}</Text></Pressable>{optional && value && <Pressable onPress={() => onChange(null)} style={styles.clear}><Text style={styles.clearText}>CLEAR</Text></Pressable>}</View>{open && <DateTimePicker value={value ?? new Date()} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} onChange={handleChange} />}</View>;
}
const styles = StyleSheet.create({ wrapper: { gap: 6 }, row: { flexDirection: "row", gap: 8 }, control: { flex: 1, minHeight: 50, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.white, paddingHorizontal: 13, justifyContent: "center" }, text: { color: colors.ink, fontSize: 15, fontWeight: "700" }, clear: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, paddingHorizontal: 10, justifyContent: "center" }, clearText: { color: colors.red, fontSize: 10, fontWeight: "900" } });
