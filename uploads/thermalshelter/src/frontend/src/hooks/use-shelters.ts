import { createActor } from "@/backend";
import type { ShelterInput, ShelterUpdate } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const SHELTERS_QUERY_KEY = ["shelters"] as const;

export function useShelters() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: SHELTERS_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listShelters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useShelter(id: bigint | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["shelter", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getShelter(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateShelter() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ShelterInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createShelter(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHELTERS_QUERY_KEY });
    },
  });
}

export function useUpdateShelter() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: bigint; input: ShelterUpdate }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateShelter(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHELTERS_QUERY_KEY });
    },
  });
}

export function useDeleteShelter() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteShelter(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHELTERS_QUERY_KEY });
    },
  });
}
