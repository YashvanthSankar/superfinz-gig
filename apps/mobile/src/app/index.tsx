import { Redirect } from "expo-router";
import { Loading } from "@/components/ui";
import { useAuth } from "@/providers/auth-provider";
export default function Index() { const { user, loading } = useAuth(); if (loading) return <Loading label="Getting your money plan ready…" />; if (!user) return <Redirect href="/login" />; if (!user.onboarded) return <Redirect href="/onboarding" />; return <Redirect href="/(app)" />; }
