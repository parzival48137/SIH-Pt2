import { createActor } from "@/backend";
import type { SiteInput, SiteUpdate } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const SITES_QUERY_KEY = ["sites"] as const;

export function useSites() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: SITES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSite(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["site", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getSite(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateSite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createSite(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SITES_QUERY_KEY });
    },
  });
}

export function useUpdateSite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: SiteUpdate }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateSite(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SITES_QUERY_KEY });
    },
  });
}

export function useDeleteSite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteSite(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SITES_QUERY_KEY });
    },
  });
}
