import { queryOptions } from "@tanstack/react-query";
import { getSpecials } from "./plans.functions";

export const specialsOptions = queryOptions({
  queryKey: ["pricing-specials"], queryFn: () => getSpecials(), staleTime: 0,
});