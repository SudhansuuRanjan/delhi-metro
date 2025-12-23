// app/api/route/route.ts
import { NextResponse } from "next/server";
import { findRoute } from "@/lib/routing";
import { LINE_FREQUENCY } from "@/data/frequency";
import { STATION_BY_ID, type StationId } from "@/data/stations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const from: StationId = body.from;
    const to: StationId = body.to;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing 'from' or 'to' station" },
        { status: 400 }
      );
    }

    const route = findRoute(from, to);
    if (!route) {
      return NextResponse.json(
        { error: "No route found" },
        { status: 404 }
      );
    }

    // Collect lines used for frequency info
    const linesUsed = Array.from(
      new Set(route.segments.map((s) => s.line))
    );

    const frequencies = linesUsed.map((line) => ({
      line,
      frequency: LINE_FREQUENCY[line],
    }));

    return NextResponse.json({
      from: STATION_BY_ID[from],
      to: STATION_BY_ID[to],
      route,
      frequencies,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
