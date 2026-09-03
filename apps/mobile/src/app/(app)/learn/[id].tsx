import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { getLearnArticleById } from "@superfinz/shared";
import { Card, Label, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

export default function Article() { const { id } = useLocalSearchParams<{ id: string }>(); const article = getLearnArticleById(id); if (!article) return <Screen title="Not found"><Text style={ui.body}>This lesson could not be found.</Text></Screen>; return <Screen><Label>{article.category} · {article.readMins} min</Label><Text style={ui.h1}>{article.title}</Text><Text style={styles.subtitle}>{article.subtitle}</Text>{article.sections.map((section, index) => <Card key={index}>{section.heading && <Text style={ui.h2}>{section.heading}</Text>}<Text style={ui.body}>{section.body}</Text></Card>)}<Card style={{ backgroundColor: colors.accentSoft }}><Label>Apply it</Label><Text style={ui.body}>{article.action}</Text></Card></Screen>; }
const styles = StyleSheet.create({ subtitle: { color: colors.accent, fontWeight: "800", fontSize: 18, lineHeight: 25 } });
