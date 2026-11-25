import { vi } from 'vitest';

export interface ApiRequest {
    method: string;
    path: string;
    query: Record<string, string>;
    body: unknown;
}

type Handler = (request: ApiRequest) => Response | Promise<Response>;

export function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function text(body: string, status = 200): Response {
    return new Response(body, { status });
}

export function pdf(contentDisposition?: string): Response {
    return new Response('%PDF-1.4', {
        headers: contentDisposition ? { 'Content-Disposition': contentDisposition } : {},
    });
}

/** Ответ, который приходит по команде теста: для гонок и промежуточных состояний. */
export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/**
 * Подменяет fetch таблицей ручек. Запрос без обработчика попадает в unexpected:
 * страницы глотают ошибки сети, и без этого опечатка в адресе прошла бы незаметно.
 */
export function mockApi() {
    const handlers = new Map<string, Handler>();
    const requests: ApiRequest[] = [];
    const unexpected: string[] = [];

    vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
        const url = new URL(input, 'http://localhost');
        const request: ApiRequest = {
            method: init.method ?? 'GET',
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
        };
        requests.push(request);

        const handler = handlers.get(`${request.method} ${request.path}`);
        if (!handler) {
            unexpected.push(`${request.method} ${request.path}`);
            throw new Error(`Нет обработчика для ${request.method} ${request.path}`);
        }
        return handler(request);
    });

    return {
        unexpected,
        requests,
        /** Ключ вида "GET /csh/api/..." */
        on(route: string, handler: Handler) {
            handlers.set(route, handler);
        },
        calls(route: string) {
            return requests.filter((r) => `${r.method} ${r.path}` === route);
        },
    };
}

/** Управляемый XMLHttpRequest: загрузка файлов идёт через него ради прогресса. */
export function mockXhr() {
    const instances: FakeXhr[] = [];

    class FakeXhr {
        method = '';
        url = '';
        status = 0;
        responseText = '';
        form: FormData | null = null;
        upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onabort: (() => void) | null = null;
        ontimeout: (() => void) | null = null;

        constructor() {
            instances.push(this);
        }
        open(method: string, url: string) {
            this.method = method;
            this.url = url;
        }
        send(form: FormData) {
            this.form = form;
        }
        progress(loaded: number, total: number, lengthComputable = true) {
            this.upload.onprogress?.({ loaded, total, lengthComputable } as ProgressEvent);
        }
        respond(status: number, body: unknown) {
            this.status = status;
            this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
            this.onload?.();
        }
    }

    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    return instances;
}

/** Перехватывает скачивание и возвращает имена файлов, отданных браузеру. */
export function captureDownloads(): string[] {
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement
    ) {
        names.push(this.download);
    });
    return names;
}
