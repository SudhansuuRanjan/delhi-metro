import { useQuery, useMutation } from "@tanstack/react-query";
import {
  searchStations,
  fetchLines,
  fetchLineStations,
  fetchStation,
  planRoute,
  fetchStatus,
  type StationRef,
  type LineRef,
  type RouteResult,
  type StationDetail,
  type LineStation,
} from "./api";

export function useStationSearch(q: string) {
  return useQuery<StationRef[]>({
    queryKey: ["stations", q],
    queryFn: () => searchStations(q),
    enabled: q.length > 0,
    placeholderData: (prev) => prev,
  });
}

export function useStations() {
  return useQuery<StationRef[]>({
    queryKey: ["stations", ""],
    queryFn: () => searchStations(""),
    staleTime: 30 * 60 * 1000,
  });
}

export function useLines() {
  return useQuery<LineRef[]>({
    queryKey: ["lines"],
    queryFn: fetchLines,
    staleTime: 30 * 60 * 1000,
  });
}

export function useLineStations(code: string) {
  return useQuery<LineStation[]>({
    queryKey: ["line", code],
    queryFn: () => fetchLineStations(code),
    enabled: !!code,
  });
}

export function useStation(code: string) {
  return useQuery<StationDetail>({
    queryKey: ["station", code],
    queryFn: () => fetchStation(code),
    enabled: !!code,
  });
}

export function useRouteMutation() {
  return useMutation<RouteResult, Error, { from: string; to: string }>({
    mutationFn: ({ from, to }) => planRoute(from, to),
  });
}

export function useSyncStatus() {
  return useQuery<{
    lastSync: number;
    stations: number;
    edges: number;
    lines: number;
  }>({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: 10 * 60 * 1000,
  });
}
