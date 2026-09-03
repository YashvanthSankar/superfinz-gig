import { useQuery } from "@tanstack/react-query";
import { Linking, Pressable, StyleSheet, Text } from "react-native";
import { apiFetch } from "@/lib/api";
import { Card, Empty, Label, Loading, Screen, ui } from "@/components/ui";
import { colors } from "@/constants/theme";

type NewsArticle = { title: string; description: string; url: string; publishedAt: string; source: { name: string }; category: string };
export default function News() { const query = useQuery({ queryKey: ["news"], queryFn: () => apiFetch<{ articles: NewsArticle[]; source: string }>("/api/news") }); if (query.isLoading) return <Loading label="Loading money news…" />; return <Screen title="Money news">{!query.data?.articles.length ? <Empty title="No headlines" body="Check again shortly." /> : query.data.articles.map((article, index) => <Pressable key={`${article.title}-${index}`} disabled={!article.url || article.url === "#"} onPress={() => Linking.openURL(article.url)}><Card><Label>{article.category} · {article.source.name}</Label><Text style={ui.h2}>{article.title}</Text><Text style={ui.body} numberOfLines={3}>{article.description}</Text><Text style={styles.date}>{new Date(article.publishedAt).toLocaleDateString("en-IN")} {article.url !== "#" ? "· OPEN →" : ""}</Text></Card></Pressable>)}</Screen>; }
const styles = StyleSheet.create({ date: { color: colors.accent, fontWeight: "900", fontSize: 10 } });
