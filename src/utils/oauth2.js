import axios from 'axios'
import { setToken, setRefreshToken, removeToken, removeRefreshToken } from '@/utils/storage'

const OAUTH_STATE_KEY = 'plaza_oauth_state'
const OAUTH_VERIFIER_KEY = 'plaza_oauth_verifier'
const OAUTH_REDIRECT_KEY = 'plaza_oauth_redirect'

const trimTrailingSlash = (value) => (value || '').replace(/\/+$/, '')

const normalizePath = (value, fallback) => {
  const path = (value || '').trim()
  if (!path) return fallback
  return path.startsWith('/') ? path : `/${path}`
}

const resolveOAuthBase = () => {
  const oauthBase = (import.meta.env.VITE_OAUTH_BASE_URL || '').trim()
  if (!oauthBase) {
    throw new Error('VITE_OAUTH_BASE_URL 未配置')
  }
  const parsed = new URL(oauthBase, window.location.origin)
  return trimTrailingSlash(`${parsed.origin}${parsed.pathname}`)
}

const resolveRedirectOrigin = () => {
  const configuredOrigin = (import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN || '').trim()
  if (!configuredOrigin) {
    return trimTrailingSlash(window.location.origin)
  }
  const parsed = new URL(configuredOrigin, window.location.origin)
  return trimTrailingSlash(parsed.origin)
}

const getOAuthConfig = () => {
  const clientId = (import.meta.env.VITE_OAUTH_CLIENT_ID || 'plaza-web-client').trim()
  const scope = (import.meta.env.VITE_OAUTH_SCOPE || 'openid profile').trim()
  const authorizePath = normalizePath(import.meta.env.VITE_OAUTH_AUTHORIZE_PATH, '/badger-identity-core-provider/oauth2/authorize')
  const tokenPath = normalizePath(import.meta.env.VITE_OAUTH_TOKEN_PATH, '/badger-identity-core-provider/oauth2/token')
  const redirectUri = `${resolveRedirectOrigin()}/login`
  const oauthBase = resolveOAuthBase()
  return {
    clientId,
    scope,
    redirectUri,
    authorizeEndpoint: `${oauthBase}${authorizePath}`,
    tokenEndpoint: `${oauthBase}${tokenPath}`
  }
}

const randomString = (length = 64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = new Uint8Array(length)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => chars[byte % chars.length]).join('')
}

const base64UrlEncode = (bytes) => {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}

const buildCodeChallenge = async (verifier) => {
  if (window?.crypto?.subtle) {
    const digest = await sha256(verifier)
    return {
      challenge: base64UrlEncode(digest),
      method: 'S256'
    }
  }
  return {
    challenge: verifier,
    method: 'plain'
  }
}

const sanitizeRedirect = (redirectPath) => {
  const value = (redirectPath || '/').trim()
  if (!value || value.startsWith('http://') || value.startsWith('https://')) {
    return '/'
  }
  const normalized = value.startsWith('/') ? value : `/${value}`
  if (normalized === '/login' || normalized.startsWith('/login?')) {
    return '/'
  }
  return normalized
}

export const startOAuthLogin = async (redirectPath = '/') => {
  const config = getOAuthConfig()
  const state = randomString(32)
  const verifier = randomString(96)
  const pkce = await buildCodeChallenge(verifier)
  const appRedirect = sanitizeRedirect(redirectPath)
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
  sessionStorage.setItem(OAUTH_VERIFIER_KEY, verifier)
  sessionStorage.setItem(OAUTH_REDIRECT_KEY, appRedirect)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state,
    code_challenge: pkce.challenge,
    code_challenge_method: pkce.method
  })
  window.location.href = `${config.authorizeEndpoint}?${params.toString()}`
}

const cleanOAuthQuery = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  const nextUrl = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState({}, document.title, nextUrl)
}

const exchangeCode = async ({ code, verifier }) => {
  const config = getOAuthConfig()
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: verifier
  })
  const response = await axios.post(config.tokenEndpoint, form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    withCredentials: true
  })
  return response.data || {}
}

export const refreshOAuthToken = async (refreshToken) => {
  const config = getOAuthConfig()
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId
  })
  const response = await axios.post(config.tokenEndpoint, form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    withCredentials: true
  })
  return response.data || {}
}

export const buildOAuthLogoutUrl = (redirectPath = '/') => {
  const oauthBase = resolveOAuthBase()
  const redirectUri = new URL(sanitizeRedirect(redirectPath), resolveRedirectOrigin()).toString()
  const params = new URLSearchParams({ redirect_uri: redirectUri })
  return `${oauthBase}/oauth2/front-logout?${params.toString()}`
}

export const handleOAuthCallbackIfNeeded = async () => {
  const url = new URL(window.location.href)
  const code = (url.searchParams.get('code') || '').trim()
  const state = (url.searchParams.get('state') || '').trim()
  const oauthError = (url.searchParams.get('error') || '').trim()
  if (!code && !oauthError) {
    return { handled: false, success: false }
  }

  const redirectPath = sanitizeRedirect(sessionStorage.getItem(OAUTH_REDIRECT_KEY) || '/')
  if (oauthError) {
    cleanOAuthQuery()
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_VERIFIER_KEY)
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY)
    removeToken()
    removeRefreshToken()
    return { handled: true, success: false, redirectPath, error: oauthError }
  }

  const expectedState = (sessionStorage.getItem(OAUTH_STATE_KEY) || '').trim()
  const verifier = (sessionStorage.getItem(OAUTH_VERIFIER_KEY) || '').trim()
  if (!expectedState || !verifier || expectedState !== state) {
    cleanOAuthQuery()
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_VERIFIER_KEY)
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY)
    removeToken()
    removeRefreshToken()
    return { handled: true, success: false, redirectPath, error: 'invalid_state' }
  }

  try {
    const tokenPayload = await exchangeCode({ code, verifier })
    const accessToken = tokenPayload.access_token || tokenPayload.accessToken || ''
    const refreshToken = tokenPayload.refresh_token || tokenPayload.refreshToken || ''
    if (!accessToken) {
      throw new Error('missing_access_token')
    }
    setToken(accessToken)
    if (refreshToken) {
      setRefreshToken(refreshToken)
    } else {
      removeRefreshToken()
    }
    cleanOAuthQuery()
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_VERIFIER_KEY)
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY)
    return { handled: true, success: true, redirectPath }
  } catch (error) {
    cleanOAuthQuery()
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_VERIFIER_KEY)
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY)
    removeToken()
    removeRefreshToken()
    return { handled: true, success: false, redirectPath, error: error?.message || 'token_exchange_failed' }
  }
}
