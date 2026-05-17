import { NextRequest, NextResponse } from 'next/server';
import { UserMeResponse } from '@/api/types';

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.kd.mospolytech.ru/api/v1';
const SERVICE_NAME = process.env.NEXT_PUBLIC_SERVICE_NAME || 'knwldg_rmbr_app';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        console.log('📡 [Proxy] Me request:', { 
            hasAuthHeader: !!authHeader,
            service_name: SERVICE_NAME 
        });
        if (!authHeader) {
            return NextResponse.json(
                { detail: 'Authorization header is required' },
                { status: 401 }
            );
        }
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': authHeader,
            },
        });
        const responseText = await response.text();
        console.log('📡 [Proxy] Me raw response:', responseText || '(empty response)');
        if (!responseText || responseText.trim() === '') {
            return new NextResponse(null, { status: response.status });
        }
        let data: UserMeResponse = {};
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.warn('Failed to parse me response:', responseText);
            return NextResponse.json(
                { detail: 'Invalid response from server' },
                { status: 500 }
            );
        }
        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error('❌ [Proxy] Me error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}