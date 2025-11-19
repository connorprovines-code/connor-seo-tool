import { google } from 'googleapis'

export class GoogleSearchConsoleClient {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  getAuthUrl(state?: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
      prompt: 'consent',
      state,
    })
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens
  }

  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await this.oauth2Client.refreshAccessToken()
    return credentials
  }

  async getSites(accessToken: string, refreshToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client,
    })

    const response = await searchconsole.sites.list()
    return response.data.siteEntry || []
  }

  async getSearchAnalytics(
    siteUrl: string,
    accessToken: string,
    refreshToken: string,
    startDate: string,
    endDate: string
  ) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client,
    })

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query', 'page', 'date', 'device', 'country'],
        rowLimit: 25000,
      },
    })

    return response.data.rows || []
  }
}

export const gscClient = new GoogleSearchConsoleClient()
