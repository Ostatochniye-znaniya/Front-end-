import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://admin.kd.mospolytech.ru/api/v1';
const SERVICE_NAME = process.env.NEXT_PUBLIC_SERVICE_NAME || 'knwldg_rmbr_app';

interface RefreshResponse {
    user_id?: string;
    access_token?: string;
    refresh_token?: string;
    detail?: any;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        console.log('📡 [Proxy] Refresh request:', { 
            hasRefreshToken: !!body.refresh_token,
            service_name: SERVICE_NAME 
        });
        
        const response = await fetch(`${API_URL}/users/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: body.refresh_token,
                service_name: SERVICE_NAME,
            }),
        });

        // Получаем текст ответа
        const responseText = await response.text();
        console.log('📡 [Proxy] Refresh raw response:', responseText);
        
        // Если ответ пустой
        if (!responseText || responseText.trim() === '') {
            return new NextResponse(null, { status: response.status });
        }
        
        // Парсим JSON
        let data: RefreshResponse = {};
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.warn('Failed to parse refresh response:', responseText);
            return NextResponse.json(
                { detail: 'Invalid response from server' },
                { status: 500 }
            );
        }
        
        // Возвращаем ТОЧНО ТАКОЙ ЖЕ ответ, как от сервера
        // (не добавляем и не удаляем поля, не заменяем null на undefined)
        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error) {
        console.error('❌ [Proxy] Refresh error:', error);
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}