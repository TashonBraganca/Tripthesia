import { NextRequest } from "next/server";
import { generateCSRFTokenResponse } from "@/lib/security/csrf";

export async function GET(request: NextRequest) {
  return await generateCSRFTokenResponse();
}