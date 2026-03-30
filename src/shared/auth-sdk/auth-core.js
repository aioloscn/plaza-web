const trimTrailingSlash = (value) => (value || '').replace(/\/+$/, '')

const normalizePath = (value, fallback = '/') => {
  const path = (value || '').trim()
  if (!path) return fallback
  return path.startsWith('/') ? path : `/${path}`
}

const sanitizeRedirect = (redirectPath) => {
  const value = (redirectPath || '/').trim()
  if (!value || value.startsWith('http://') || value.startsWith('https://')) return '/'
  const normalized = value.startsWith('/') ? value : `/${value}`
  if (normalized === '/login' || normalized.startsWith('/login?')) return '/'
  return normalized
}

const randomString = (length = 64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = new Uint8Array(length)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => chars[byte % chars.length]).join('')
}

const base64UrlEncode = (bytes) => {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const sha256 = async (plain) => {
  const data = new TextEncoder().encode(plain)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}

const buildCodeChallenge = async (verifier) => {
  if (window?.crypto?.subtle) {
    return { challenge: base64UrlEncode(await sha256(verifier)), method: 'S256' }
  }
  return { challenge: verifier, method: 'plain' }
}

export const createTokenStore = (opts) => {
  const local = opts.local || window.localStorage
  const session = opts.session || window.sessionStorage
  return {
    getAccessToken: () => local.getItem(opts.accessTokenKey) || '',
    setAccessToken: (v) => v && local.setItem(opts.accessTokenKey, v),
    removeAccessToken: () => local.removeItem(opts.accessTokenKey),
    getRefreshToken: () => local.getItem(opts.refreshTokenKey) || '',
    setRefreshToken: (v) => v && local.setItem(opts.refreshTokenKey, v),
    removeRefreshToken: () => local.removeItem(opts.refreshTokenKey),
    setState: (v) => session.setItem(opts.stateKey, v),
    getState: () => (session.getItem(opts.stateKey) || '').trim(),
    removeState: () => session.removeItem(opts.stateKey),
    setVerifier: (v) => session.setItem(opts.verifierKey, v),
    getVerifier: () => (session.getItem(opts.verifierKey) || '').trim(),
    removeVerifier: () => session.removeItem(opts.verifierKey),
    setRedirect: (v) => session.setItem(opts.redirectKey, sanitizeRedirect(v)),
    getRedirect: () => sanitizeRedirect(session.getItem(opts.redirectKey) || '/'),
    removeRedirect: () => session.removeItem(opts.redirectKey),
    clear: () => {
      local.removeItem(opts.accessTokenKey)
      local.removeItem(opts.refreshTokenKey)
      session.removeItem(opts.stateKey)
      session.removeItem(opts.verifierKey)
      session.removeItem(opts.redirectKey)
    }
  }
}

export const buildOAuthConfig = (input, defaults = {}) => {
  const baseRaw = (input.baseUrl || '').trim()
  if (!baseRaw) throw new Error(defaults.baseError || 'oauth base url is required')
  const baseParsed = new URL(baseRaw, window.location.origin)
  const oauthBase = trimTrailingSlash(`${baseParsed.origin}${baseParsed.pathname}`)
  const redirectOriginRaw = (input.redirectOrigin || '').trim()
  const redirectOrigin = redirectOriginRaw
    ? trimTrailingSlash(new URL(redirectOriginRaw, window.location.origin).origin)
    : trimTrailingSlash(window.location.origin)
  return {
    oauthBase,
    redirectOrigin,
    clientId: (input.clientId || defaults.clientId || '').trim(),
    scope: (input.scope || defaults.scope || '').trim(),
    authorizeEndpoint: `${oauthBase}${normalizePath(input.authorizePath, defaults.authorizePath || '/oauth2/authorize')}`,
    tokenEndpoint: `${oauthBase}${normalizePath(input.tokenPath, defaults.tokenPath || '/oauth2/token')}`,
    redirectUri: `${redirectOrigin}${normalizePath(input.redirectPath, defaults.redirectPath || '/login')}`
  }
}

export const createOAuthClient = ({ getConfig, tokenStore, httpClient }) => {
  const clearOAuthQuery = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.delete('error')
    url.searchParams.delete('error_description')
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
  }

  const exchangeCode = async ({ code, verifier }) => {
    const c = getConfig()
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: c.redirectUri,
      client_id: c.clientId,
      code_verifier: verifier
    })
    const resp = await httpClient.post(c.tokenEndpoint, form.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, withCredentials: true })
    return resp.data || {}
  }

  return {
    startLogin: async (redirectPath = '/') => {
      const c = getConfig()
      const state = randomString(32)
      const verifier = randomString(96)
      const pkce = await buildCodeChallenge(verifier)
      tokenStore.setState(state)
      tokenStore.setVerifier(verifier)
      tokenStore.setRedirect(redirectPath)
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: c.clientId,
        redirect_uri: c.redirectUri,
        scope: c.scope,
        state,
        code_challenge: pkce.challenge,
        code_challenge_method: pkce.method
      })
      window.location.href = `${c.authorizeEndpoint}?${params.toString()}`
    },
    refreshToken: async (refreshToken) => {
      const c = getConfig()
      const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: c.clientId })
      const resp = await httpClient.post(c.tokenEndpoint, form.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, withCredentials: true })
      return resp.data || {}
    },
    handleCallbackIfNeeded: async () => {
      const url = new URL(window.location.href)
      const code = (url.searchParams.get('code') || '').trim()
      const state = (url.searchParams.get('state') || '').trim()
      const oauthError = (url.searchParams.get('error') || '').trim()
      if (!code && !oauthError) return { handled: false, success: false }
      const redirectPath = tokenStore.getRedirect()
      if (oauthError) {
        clearOAuthQuery()
        tokenStore.clear()
        return { handled: true, success: false, redirectPath, error: oauthError }
      }
      const expectedState = tokenStore.getState()
      const verifier = tokenStore.getVerifier()
      if (!expectedState || !verifier || expectedState !== state) {
        clearOAuthQuery()
        tokenStore.clear()
        return { handled: true, success: false, redirectPath, error: 'invalid_state' }
      }
      try {
        const payload = await exchangeCode({ code, verifier })
        const accessToken = payload.access_token || payload.accessToken || ''
        const refreshToken = payload.refresh_token || payload.refreshToken || ''
        if (!accessToken) throw new Error('missing_access_token')
        tokenStore.setAccessToken(accessToken)
        refreshToken ? tokenStore.setRefreshToken(refreshToken) : tokenStore.removeRefreshToken()
        clearOAuthQuery()
        tokenStore.removeState()
        tokenStore.removeVerifier()
        tokenStore.removeRedirect()
        return { handled: true, success: true, redirectPath }
      } catch (e) {
        clearOAuthQuery()
        tokenStore.clear()
        return { handled: true, success: false, redirectPath, error: e?.message || 'token_exchange_failed' }
      }
    },
    buildLogoutUrl: (redirectPath = '/') => {
      const c = getConfig()
      const redirectUri = new URL(sanitizeRedirect(redirectPath), c.redirectOrigin).toString()
      return `${c.oauthBase}/oauth2/front-logout?${new URLSearchParams({ redirect_uri: redirectUri }).toString()}`
    }
  }
}
