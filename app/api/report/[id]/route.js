"use server";

import { NextResponse } from "next/server";
import { apiInternal as api } from "@/utils/routes";
import { getAuthToken } from "@/utils/auth";

export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;

  try {
    const backendUrl = `${api}exam/pdf/${id}`;
    const token = await getAuthToken();

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      // Try to parse error message
      const textData = await response.text();
      try {
        const jsonData = JSON.parse(textData);
        return new NextResponse(
          jsonData?.message ?? "Тайлан татахад алдаа гарлаа.",
          {
            status: 202,
          }
        );
      } catch {
        return new NextResponse("Тайлан татахад алдаа гарлаа.", {
          status: 202,
        });
      }
    }

    // Get PDF as array buffer
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-${id}.pdf"`,
      },
    });
  } catch (err) {
    console.log("errr", err);
    return new NextResponse(err.message ?? "Тайлан татахад алдаа гарлаа", {
      status: 500,
    });
  }
}
