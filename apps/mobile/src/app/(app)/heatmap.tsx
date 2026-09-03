import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import type { HeatmapPointDto } from "@superfinz/shared";
import { apiFetch } from "@/lib/api";
import { Card, Empty, Label, Loading, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

export default function Heatmap() {
  const query = useQuery({ queryKey: ["heatmap"], queryFn: () => apiFetch<{ heatmap: HeatmapPointDto[] }>("/api/heatmap") }); if (query.isLoading) return <Loading label="Loading heatmap…" />; const map = new Map(query.data?.heatmap.map((item) => [item.date, item])); const max = Math.max(1, ...(query.data?.heatmap.map((item) => item.total) ?? [1])); const days = Array.from({ length: 91 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (90 - index)); return date.toISOString().slice(0, 10); });
  return <Screen title="Heatmap"><Text style={ui.body}>Your last 13 weeks. Darker squares mean higher daily spending.</Text>{!query.data?.heatmap.length ? <Empty title="No spend data" body="Log a few transactions to reveal your pattern." /> : <Card><View style={styles.grid}>{days.map((date) => { const item = map.get(date); const opacity = item ? .2 + item.total / max * .8 : .08; return <View key={date} accessibilityLabel={`${date}: ₹${item?.total ?? 0}`} style={[styles.cell, { backgroundColor: `rgba(244,81,30,${opacity})` }]} />; })}</View><View style={ui.between}><Label>Less</Label><Label>More</Label></View></Card>}<Card><Label>How to read it</Label><Text style={ui.body}>Look for clusters around weekends, paydays, or recurring bill dates. The pattern is often more useful than any single purchase.</Text></Card></Screen>;
}
const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 5 }, cell: { width: 17, height: 17, borderWidth: 1, borderColor: colors.ink } });
