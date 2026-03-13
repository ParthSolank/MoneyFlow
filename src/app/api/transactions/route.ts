
import { NextResponse } from "next/server";

const DOTNET_API_URL = process.env.DOTNET_API_URL || 'http://127.0.0.1:5039';

export async function GET() {
    try {
        const response = await fetch(`${DOTNET_API_URL}/api/transactions`, {
            cache: 'no-store',
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const response = await fetch(`${DOTNET_API_URL}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
