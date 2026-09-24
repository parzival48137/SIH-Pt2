import { createActor } from "@/backend";
import type { AnalysisInput, AnalysisUpdate } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const ANALYSES_QUERY_KEY = ["analyses"] as const;

export function useAnalyses() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ANALYSES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAnalyses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAnalysis(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["analysis", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getAnalysis(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnalysisInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createAnalysis(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ANALYSES_QUERY_KEY });
    },
  });
}

export function useUpdateAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: bigint; input: AnalysisUpdate }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateAnalysis(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ANALYSES_QUERY_KEY });
    },
  });
}

export function useDeleteAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteAnalysis(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ANALYSES_QUERY_KEY });
    },
  });
}
