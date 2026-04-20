import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createHash } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, message: "Expected multipart/form-data" }, { status: 400 });
    }
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "File too large" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Invalid file type" }, { status: 400 });
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary env vars');
      return NextResponse.json({ success: false, message: "Server upload not configured" }, { status: 500 });
    }
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const outForm = new FormData();
    outForm.append("file", file);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex');
    outForm.append('timestamp', String(timestamp));
    outForm.append('api_key', apiKey);
    outForm.append('signature', signature);

    const res = await fetch(uploadUrl, {
      method: "POST",
      body: outForm,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Cloudinary upload failed', text);
      return NextResponse.json({ success: false, message: "Upload to cloud failed" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ success: true, url: data.secure_url, public_id: data.public_id, raw: data });
  } catch (err: any) {
    console.error('Upload route error', err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const publicId = String(body.publicId || body.public_id || '').trim();
    if (!publicId) {
      return NextResponse.json({ success: false, message: 'Missing publicId' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary env vars for delete');
      return NextResponse.json({ success: false, message: 'Server not configured' }, { status: 500 });
    }

    const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const params = new URLSearchParams();
    params.append('public_id', publicId);
    params.append('invalidate', 'true');

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const res = await fetch(destroyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Cloudinary delete failed', data);
      return NextResponse.json({ success: false, message: 'Cloud deletion failed' }, { status: 502 });
    }

    // Cloudinary returns { result: 'ok' } on success, or { result: 'not found' }
    if (data.result === 'ok' || data.result === 'not found') {
      return NextResponse.json({ success: true, result: data.result });
    }

    return NextResponse.json({ success: false, message: 'Unknown cloud response', raw: data }, { status: 500 });
  } catch (err: any) {
    console.error('Upload DELETE error', err);
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
