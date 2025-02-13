import type { NextRequest } from "next/server";
import { parseFramesWithReports } from "frames.js/parseFramesWithReports";
import type { ParseFramesWithReportsResult } from "frames.js/frame-parsers";
import { getFrame, type GetFrameResult } from "frames.js";
import { isSpecificationValid } from "./validators";

export type GETResponse =
  | ParseFramesWithReportsResult
  | GetFrameResult
  | { message: string };

/** Proxies fetching a frame through a backend to avoid CORS issues and preserve user IP privacy */
export async function GET(request: Request | NextRequest): Promise<Response> {
  try {
    const searchParams =
      "nextUrl" in request
        ? request.nextUrl.searchParams
        : new URL(request.url).searchParams;
    const url = searchParams.get("url");
    const specification = searchParams.get("specification") ?? "farcaster";
    const multiSpecificationEnabled =
      searchParams.get("multispecification") === "true";

    if (!url) {
      return Response.json({ message: "Invalid URL" } satisfies GETResponse, {
        status: 400,
      });
    }

    const urlRes = await fetch(url);
    const html = await urlRes.text();

    if (multiSpecificationEnabled) {
      const result: ParseFramesWithReportsResult = parseFramesWithReports({
        html,
        fallbackPostUrl: url,
      });

      return Response.json(result satisfies GETResponse);
    }

    if (!isSpecificationValid(specification)) {
      return Response.json(
        { message: "Invalid specification" } satisfies GETResponse,
        {
          status: 400,
        }
      );
    }

    const result = getFrame({
      htmlString: html,
      url,
      specification,
    });

    return Response.json(result satisfies GETResponse);
  } catch (err) {
    // eslint-disable-next-line no-console -- provide feedback to the developer
    console.error(err);
    return Response.json({ message: String(err) } satisfies GETResponse, {
      status: 500,
    });
  }
}
