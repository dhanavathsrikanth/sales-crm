import SettingsClient from "./SettingsClient"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams
  const initialTab = params.tab || "custom-fields"
  return <SettingsClient initialTab={initialTab} />
}