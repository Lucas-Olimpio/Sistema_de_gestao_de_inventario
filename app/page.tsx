import { getDashboardData } from "@/lib/dashboard-data";
import DashboardClient from "./dashboard-client";
import { PeriodKey } from "@/lib/types";

function getDateRange(period: PeriodKey): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { from: to, to };
    case "7d": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "30d": {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "12m": {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "custom":
      return { from: "", to: "" }; // Handled by searchParams directly
    default:
      return { from: to, to };
  }
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams (Next.js 15 requirement, good practice for future compatibility)
  const params = await searchParams;

  const period = (params.period as PeriodKey) || "30d";
  let from = (params.from as string) || "";
  let to = (params.to as string) || "";

  if (period !== "custom") {
    const range = getDateRange(period);
    from = range.from;
    to = range.to;
  }

  // Fetch data on the server
  const data = await getDashboardData(from, to);

  return <DashboardClient data={data} />;
}
