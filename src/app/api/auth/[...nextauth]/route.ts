import { handlers } from "@/auth";

export const { GET, POST } = handlers;
export const runtime = "nodejs"; // ensure Mongoose native driver works correctly
