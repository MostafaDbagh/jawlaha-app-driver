import { apiUrl, API } from './constants';
import { CustomResponse, PageEntity } from './CustomResponse';
import { getCurrentLang } from '../../i18n/I18nProvider';
import { secureStorage } from '../storage';

// In-memory token mirror (LocalStaticVar.token).
let inMemoryToken = '';
export const setAuthToken = (token: string) => {
  inMemoryToken = token ?? '';
};
export const getAuthToken = () => inMemoryToken;
export const hydrateAuthToken = async () => {
  inMemoryToken = await secureStorage.getToken();
  return inMemoryToken;
};

// Optional hook that refreshes the access token (registered by the auth layer
// to avoid a circular import). Returns true if a new token is now in place.
// Access tokens are short-lived (~15m), so without this every authenticated
// request silently 401s once the token expires.
type TokenRefresher = () => Promise<boolean>;
let tokenRefresher: TokenRefresher | null = null;
export const setTokenRefresher = (fn: TokenRefresher | null) => {
  tokenRefresher = fn;
};
// Guard so concurrent 401s trigger a single refresh, not a stampede.
let refreshInFlight: Promise<boolean> | null = null;

// Optional hook fired once when an authenticated request can't be recovered
// (no refresh token, or refresh + retry still 401). Registered by the auth
// layer (avoids a circular import) to clear the session and bounce to login.
type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;
export const setSessionExpiredHandler = (fn: SessionExpiredHandler | null) => {
  sessionExpiredHandler = fn;
};
// Latch so a burst of 401s (parallel requests) triggers a single logout, not a
// loop. Reset by the auth layer on a fresh login.
let sessionExpiredFired = false;
export const resetSessionExpired = () => {
  sessionExpiredFired = false;
};
function fireSessionExpired() {
  if (sessionExpiredFired || !sessionExpiredHandler) return;
  sessionExpiredFired = true;
  sessionExpiredHandler();
}

export interface BaseEnvelope {
  status?: boolean;
  /** jawlahapp sends the human-readable text as `message` (singular). */
  message?: string;
  messages?: string;
  code?: number;
  count?: number;
  data?: any;
}

type FromJson<T> = (json: any) => T;
type Query = Record<string, any> | undefined;

interface BaseOpts {
  subUrl: string;
  url?: string;
  token?: string;
  needToken?: boolean;
  query?: Query;
}

function buildHeaders(needToken: boolean, token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': getCurrentLang(),
    'User-Agent': API.userAgent,
  };
  if (needToken) {
    const authToken = token ?? inMemoryToken;
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

function withQuery(base: string, query: Query): string {
  if (!query) return base;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseEnvelope(res: Response): Promise<BaseEnvelope> {
  const text = await res.text();
  if (!text) return { status: res.ok, messages: '', data: null };
  try {
    const env = JSON.parse(text) as BaseEnvelope;
    // jawlahapp returns `message`; the rest of the client reads `messages`.
    if (env.messages == null && env.message != null) env.messages = env.message;
    return env;
  } catch {
    return { status: res.ok, messages: text, data: null };
  }
}

function networkError(): CustomResponse {
  return new CustomResponse(-1, [], 'server_error', false);
}

// Single fetch entry point. For authenticated requests, a 401 triggers one
// token refresh (shared across concurrent callers) and a single retry with the
// freshly-stored token, so a merely-expired access token self-heals instead of
// surfacing as a failure.
async function performFetch(
  method: string,
  target: string,
  needToken: boolean,
  token: string | undefined,
  body: string | undefined,
): Promise<Response> {
  const send = () =>
    fetch(target, { method, headers: buildHeaders(needToken, token), body });

  let res = await send();
  if (res.status === 401 && needToken && tokenRefresher) {
    if (!refreshInFlight) {
      refreshInFlight = tokenRefresher().finally(() => {
        refreshInFlight = null;
      });
    }
    const refreshed = await refreshInFlight;
    // Retry with the new token only when no explicit token was pinned by the
    // caller (buildHeaders falls back to the refreshed in-memory token).
    if (refreshed && token == null) res = await send();
    // Genuine auth failure: refresh wasn't possible (no/expired refresh token)
    // or the retried request still 401s. Bounce to login once. A 401 on a
    // caller-pinned token isn't the session's fault, so leave those alone.
    if (token == null && res.status === 401) fireSessionExpired();
  }
  return res;
}

export const apiClient = {
  /** Plain GET — returns raw envelope data (mirrors DioSetting.get). */
  async get(opts: BaseOpts): Promise<CustomResponse> {
    const { subUrl, url, token, needToken = false, query } = opts;
    try {
      const target = withQuery(url ? `${url}/${subUrl}` : apiUrl(subUrl), query);
      const res = await performFetch('GET', target, needToken, token, undefined);
      const text = await res.text();
      let data: any = text;
      try { data = JSON.parse(text); } catch { /* keep text */ }
      return new CustomResponse(res.status, data, '', true);
    } catch {
      return networkError();
    }
  },

  /** GET that parses the envelope into a model (mirrors DioSetting.getV2). */
  async getV2<T>(
    opts: BaseOpts & { fromJson?: FromJson<T>; isListOfModel?: boolean },
  ): Promise<CustomResponse<T | T[] | null>> {
    const { subUrl, url, token, needToken = false, query, fromJson, isListOfModel } = opts;
    try {
      const target = withQuery(url ? `${url}/${subUrl}` : apiUrl(subUrl), query);
      const res = await performFetch('GET', target, needToken, token, undefined);
      const env = await parseEnvelope(res);
      if (env.status == null || !env.status) {
        return new CustomResponse(res.status, '' as any, env.messages, false);
      }
      if (isListOfModel) {
        const list = ((env.data as any[]) ?? []).map((e) => (fromJson ? fromJson(e) : e));
        return new CustomResponse(res.status, list as T[], env.messages, true);
      }
      if (env.data == null) {
        return new CustomResponse(res.status, null, env.messages, true);
      }
      const result = fromJson ? fromJson(env.data) : (env.data as T);
      return new CustomResponse(res.status, result, env.messages, true);
    } catch {
      return networkError();
    }
  },

  /** GET paginated list (mirrors DioSetting.getPagination). */
  async getPagination<T>(
    opts: BaseOpts & { fromJson: FromJson<T> },
  ): Promise<CustomResponse<PageEntity<T> | string>> {
    const { subUrl, url, token, needToken = false, query, fromJson } = opts;
    try {
      const target = withQuery(url ? `${url}/${subUrl}` : apiUrl(subUrl), query);
      const res = await performFetch('GET', target, needToken, token, undefined);
      const env = await parseEnvelope(res);
      if (env.status == null || !env.status) {
        return new CustomResponse(res.status, '', env.messages, false);
      }
      const page = env.data ?? {};
      const list = ((page.data as any[]) ?? []).map((e) => fromJson(e));
      const result: PageEntity<T> = {
        data: list,
        totalPage: page.last_page ?? 1,
        unreadCount: page.count_unread,
        total: page.total,
      };
      return new CustomResponse(res.status, result, env.messages, true);
    } catch {
      return networkError();
    }
  },

  /** Plain POST (mirrors DioSetting.post). */
  async post(opts: BaseOpts & { data?: any }): Promise<CustomResponse> {
    return this._send('POST', opts);
  },

  /** POST that optionally parses a model (mirrors DioSetting.postV2). */
  async postV2<T>(
    opts: BaseOpts & { data?: any; fromJson?: FromJson<T>; isListOfModel?: boolean },
  ): Promise<CustomResponse> {
    const { subUrl, url, token, needToken = false, query, data, fromJson, isListOfModel } = opts;
    try {
      const target = withQuery(url ? `${url}/${subUrl}` : apiUrl(subUrl), query);
      const res = await performFetch(
        'POST',
        target,
        needToken,
        token,
        data != null ? JSON.stringify(data) : undefined,
      );
      const env = await parseEnvelope(res);
      if (!fromJson) {
        return new CustomResponse(res.status, env, env.messages, env.status ?? res.ok);
      }
      // Honor the envelope's status flag like getV2 does. Without this an error
      // response (e.g. a 401 with `success:false`) was reported as success, so
      // callers fired success UI while the parsed object was empty.
      if (env.status == null || !env.status) {
        return new CustomResponse(res.status, '' as any, env.messages, false);
      }
      if (isListOfModel) {
        const list = ((env.data as any[]) ?? []).map((e) => fromJson(e));
        return new CustomResponse(res.status, list, env.messages, true);
      }
      const result = fromJson(env.data);
      return new CustomResponse(res.status, result, env.messages, true);
    } catch {
      return networkError();
    }
  },

  async delete(opts: BaseOpts & { data?: any }): Promise<CustomResponse> {
    return this._send('DELETE', opts);
  },

  async put(opts: BaseOpts & { data?: any }): Promise<CustomResponse> {
    return this._send('PUT', opts);
  },

  async patch(opts: BaseOpts & { data?: any }): Promise<CustomResponse> {
    return this._send('PATCH', opts);
  },

  async _send(
    method: string,
    opts: BaseOpts & { data?: any },
  ): Promise<CustomResponse> {
    const { subUrl, url, token, needToken = false, query, data } = opts;
    try {
      const target = withQuery(url ? `${url}/${subUrl}` : apiUrl(subUrl), query);
      const res = await performFetch(
        method,
        target,
        needToken,
        token,
        data != null ? JSON.stringify(data) : undefined,
      );
      const env = await parseEnvelope(res);
      return new CustomResponse(res.status, env, env.messages, env.status ?? res.ok);
    } catch {
      return networkError();
    }
  },
};
