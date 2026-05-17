import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_ADMIN_API_URL } from '@/config';
import { NEXT_PUBLIC_SERVICE_NAME } from '@/config';

const API_URL =  NEXT_PUBLIC_ADMIN_API_URL
const SERVICE_NAME = NEXT_PUBLIC_SERVICE_NAME

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                login: body.login,
                raw_password: body.password,
                service_name: SERVICE_NAME,
            }),
        });
        const data = await response.json();       
        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}