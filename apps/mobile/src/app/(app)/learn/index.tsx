import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { LEARN_ARTICLES } from "@superfinz/shared";
import { Card, Label, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

export default function Learn() { return <Screen title="Learn"><Text style={ui.body}>Short, practical lessons you can apply to your plan today.</Text>{LEARN_ARTICLES.map((article) => <Pressable key={article.id} onPress={() => router.push({ pathname: "/(app)/learn/[id]", params: { id: article.id } })}><Card><Label>{article.category} · {article.level}</Label><Text style={ui.h2}>{article.title}</Text><Text style={ui.body}>{article.subtitle}</Text><Text style={styles.meta}>{article.readMins} MIN READ →</Text></Card></Pressable>)}</Screen>; }
const styles = StyleSheet.create({ meta: { color: colors.accent, fontWeight: "900", fontSize: 10, letterSpacing: 1 } });
