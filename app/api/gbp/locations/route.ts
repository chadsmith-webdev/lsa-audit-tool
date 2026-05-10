import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { getAccessTokenForUser, listAllLocations } from "@/lib/gbp-api";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = await getAccessTokenForUser(user.id);
    const pairs = await listAllLocations(accessToken);
    const locations = pairs.map(({ account, location }) => ({
      accountName: account.name,
      accountLabel: account.accountName ?? account.name,
      locationName: location.name,
      title: location.title,
      addressLine: formatAddress(location.storefrontAddress),
    }));
    return NextResponse.json({ locations });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list locations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatAddress(addr?: {
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
}): string {
  if (!addr) return "";
  const street = (addr.addressLines ?? []).join(", ");
  const cityState = [addr.locality, addr.administrativeArea]
    .filter(Boolean)
    .join(", ");
  return [street, cityState, addr.postalCode].filter(Boolean).join(" · ");
}
