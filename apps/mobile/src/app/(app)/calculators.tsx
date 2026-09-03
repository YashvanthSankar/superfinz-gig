import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { calculateEmi, calculateFd, calculateSip } from "@superfinz/shared";
import { Card, Field, Label, Money, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

type Mode = "SIP" | "FD" | "EMI";
const positive = (value: string, fallback = 0) => { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : fallback; };

export default function Calculators() {
  const [mode, setMode] = useState<Mode>("SIP");
  const [sip, setSip] = useState({ amount: "5000", rate: 12, years: 10 });
  const [fd, setFd] = useState({ amount: "100000", rate: 7, years: 3 });
  const [emi, setEmi] = useState({ amount: "500000", rate: 10, years: 5 });
  const investmentResult = mode === "SIP" ? calculateSip(positive(sip.amount), sip.rate, sip.years) : calculateFd(positive(fd.amount), fd.rate, fd.years);
  const emiResult = calculateEmi(positive(emi.amount), emi.rate, emi.years);
  const current = mode === "SIP" ? sip : mode === "FD" ? fd : emi;
  const setCurrent = (next: Partial<typeof current>) => mode === "SIP" ? setSip((value) => ({ ...value, ...next })) : mode === "FD" ? setFd((value) => ({ ...value, ...next })) : setEmi((value) => ({ ...value, ...next }));
  const isEmi = mode === "EMI";
  return <Screen title="Calculators"><View style={styles.tabs}>{(["SIP", "FD", "EMI"] as Mode[]).map((item) => <Pressable key={item} onPress={() => setMode(item)} style={[styles.tab, mode === item && styles.active]}><Text style={[styles.tabText, mode === item && { color: colors.white }]}>{item}</Text></Pressable>)}</View><Card><Field label={mode === "SIP" ? "Monthly investment" : mode === "FD" ? "Principal amount" : "Loan amount"} value={current.amount} onChangeText={(amount) => setCurrent({ amount })} keyboardType="numeric" /><Range label={`${isEmi ? "Interest" : mode === "FD" ? "Interest" : "Expected return"}: ${current.rate.toFixed(mode === "FD" ? 1 : 0)}% p.a.`} value={current.rate} minimum={1} maximum={mode === "SIP" ? 30 : mode === "FD" ? 15 : 25} step={mode === "FD" || isEmi ? .5 : 1} onChange={(rate) => setCurrent({ rate })} /><Range label={`${isEmi ? "Tenure" : mode === "FD" ? "Tenure" : "Duration"}: ${current.years} years`} value={current.years} minimum={1} maximum={mode === "SIP" ? 40 : mode === "FD" ? 10 : 30} step={1} onChange={(years) => setCurrent({ years })} /></Card><Card style={{ backgroundColor: colors.greenSoft }}><Label>{isEmi ? "Monthly EMI" : "Projected value"}</Label><Money value={isEmi ? emiResult.emi : investmentResult.value} compact />{isEmi ? <Text style={ui.body}>Principal ₹{positive(emi.amount).toLocaleString("en-IN")}{`\n`}Total interest ₹{Math.round(emiResult.interest).toLocaleString("en-IN")}{`\n`}Total payment ₹{Math.round(emiResult.total).toLocaleString("en-IN")}</Text> : <Text style={ui.body}>Invested ₹{Math.round(investmentResult.invested).toLocaleString("en-IN")}{`\n`}Estimated growth ₹{Math.round(investmentResult.returns).toLocaleString("en-IN")}</Text>}</Card><Text style={ui.small}>Illustrations only. Returns and interest-rate conditions can change.</Text></Screen>;
}

function Range({ label, value, minimum, maximum, step, onChange }: { label: string; value: number; minimum: number; maximum: number; step: number; onChange: (value: number) => void }) { return <View style={{ gap: 4 }}><Label>{label}</Label><Slider value={value} minimumValue={minimum} maximumValue={maximum} step={step} onValueChange={onChange} minimumTrackTintColor={colors.accent} maximumTrackTintColor={colors.paper2} thumbTintColor={colors.ink} /></View>; }
const styles = StyleSheet.create({ tabs: { flexDirection: "row", gap: 8 }, tab: { flex: 1, minHeight: 46, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }, active: { backgroundColor: colors.ink }, tabText: { color: colors.ink, fontWeight: "900" } });
