import axios from 'axios'
import { createTokenStore, buildOAuthConfig, createOAuthClient } from '@auth-sdk/auth-core.js'

const tokenStore = createTokenStore({
  accessTokenKey: 'plaza_token',
  refreshTokenKey: 'plaza_refresh_token',
  stateKey: 'plaza_oauth_state',
  verifierKey: 'plaza_oauth_verifier',
  redirectKey: 'plaza_oauth_redirect'
})

const getConfig = () => buildOAuthConfig({
  baseUrl: import.meta.env.VITE_OAUTH_BASE_URL,
  redirectOrigin: import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN,
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
  scope: import.meta.env.VITE_OAUTH_SCOPE,
  authorizePath: import.meta.env.VITE_OAUTH_AUTHORIZE_PATH,
  tokenPath: import.meta.env.VITE_OAUTH_TOKEN_PATH,
  redirectPath: '/login'
}, {
  clientId: 'plaza-web-client',
  scope: 'openid profile'
})

const oauthClient = createOAuthClient({
  getConfig,
  tokenStore,
  httpClient: axios
})

export const startOAuthLogin = (redirectPath = '/') => oauthClient.startLogin(redirectPath)
export const refreshOAuthToken = (refreshToken) => oauthClient.refreshToken(refreshToken)
export const buildOAuthLogoutUrl = (redirectPath = '/') => oauthClient.buildLogoutUrl(redirectPath)
export const handleOAuthCallbackIfNeeded = () => oauthClient.handleCallbackIfNeeded()
