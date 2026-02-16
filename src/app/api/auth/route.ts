import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";

/**
 * GET /api/auth -- Check if password protection is enabled.
 * When SITE_PASSWORD is not set, automatically grants a session cookie
 * so the middleware allows subsequent requests through.
 */
export async function GET() {
  try {
    const { env } = await getCloudflareContext();

    if (!env.SITE_PASSWORD) {
      // Auth not configured -- grant access automatically
      const response = NextResponse.json({ required: false });
      response.cookies.set(SESSION_COOKIE, "open", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      return response;
    }

    return NextResponse.json({ required: true });
  } catch (error) {
    console.error("Auth check error:", error);
    // If we can't read the env, assume auth is not required
    const response = NextResponse.json({ required: false });
    response.cookies.set(SESSION_COOKIE, "open", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }
}

/**
 * POST /api/auth -- Log in with password.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext();

    if (!env.SITE_PASSWORD) {
      return NextResponse.json(
        { error: "Auth is not configured on the server" },
        { status: 500 }
      );
    }

    if (password !== env.SITE_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(env.SITE_PASSWORD);
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth -- Log out.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
