import { z } from "zod";

export const reportParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid report ID" }),
});

const locationSchema = z.object({
  lat: z
    .number()
    .refine((val) => val >= -90 && val <= 90, {
      message: "Invalid location detected",
    }),

  lng: z
    .number()
    .refine((val) => val >= -180 && val <= 180, {
      message: "Invalid location detected",
    }),

  address: z
    .string()
    .trim()
    .min(3, { message: "Address is too short" })
    .max(500, { message: "Address too long" }),
});

export const reportSchema = z.object({
  reportText: z
    .string()
    .trim()
    .min(10, { message: "Please provide more details about the issue" })
    .max(1000, { message: "Report is too long" }),

  location: locationSchema,
});

export type ReportRequest = z.infer<typeof reportSchema>;
