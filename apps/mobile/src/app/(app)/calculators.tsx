import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { calculateFd, calculateFire, calculateSip } from "@superfinz/shared";
import { Card, Field, Label, Money, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

type Mode = "SIP" | "FD" | "FIRE";
export default function Calculators() {
  const [mode, setMode] = useState<Mode>("SIP"); const [amount, setAmount] = useState("5000"); const [rate, setRate] = useState("12"); const [years, setYears] = useState("10");
  const result = mode === "SIP" ? calculateSip(Number(amount), Number(rate), Number(years)) : mode === "FD" ? calculateFd(Number(amount), Number(rate), Number(years)) : { invested: 0, returns: 0, value: calculateFire(Number(amount)) };
  return <Screen title="Calculators"><View style={styles.tabs}>{(["SIP", "FD", "FIRE"] as Mode[]).map((item) => <Pressable key={item} onPress={() => { setMode(item); setRate(item === "FD" ? "7" : "12"); }} style={[styles.tab, mode === item && styles.active]}><Text style={[styles.tabText, mode === item && { color: colors.white }]}>{item}</Text></Pressable>)}</View><Card><Field label={mode === "SIP" ? "Monthly investment" : mode === "FD" ? "Deposit amount" : "Monthly expenses"} value={amount} onChangeText={setAmount} keyboardType="numeric" />{mode !== "FIRE" && <><Field label="Expected annual rate (%)" value={rate} onChangeText={setRate} keyboardType="numeric" /><Field label="Years" value={years} onChangeText={setYears} keyboardType="numeric" /></>}</Card><Card style={{ backgroundColor: colors.greenSoft }}><Label>{mode === "FIRE" ? "Estimated target" : "Projected value"}</Label><Money value={result.value} compact />{mode !== "FIRE" && <Text style={ui.body}>Invested ₹{Math.round(result.invested).toLocaleString("en-IN")}{`\n`}Estimated growth ₹{Math.round(result.returns).toLocaleString("en-IN")}</Text>}</Card><Text style={ui.small}>Illustrations only. Market returns are not guaranteed.</Text></Screen>;
}
const styles = StyleSheet.create({ tabs: { flexDirection: "row", gap: 8 }, tab: { flex: 1, minHeight: 46, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }, active: { backgroundColor: colors.ink }, tabText: { color: colors.ink, fontWeight: "900" } });
