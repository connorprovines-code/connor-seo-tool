// Puppeteer browser utility for Vercel serverless functions
import type { Browser, Page } from 'puppeteer-core'

let chromium: any
let puppeteer: any

// Dynamically import based on environment
async function getBrowserDeps() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Use @sparticuz/chromium for Vercel
    chromium = await import('@sparticuz/chromium')
    puppeteer = (await import('puppeteer-core')).default
  } else {
    // Use regular puppeteer for local development
    puppeteer = (await import('puppeteer')).default
  }
}

export async function getBrowser(): Promise<Browser> {
  await getBrowserDeps()

  if (chromium) {
    // Vercel/Production environment
    return await puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
      ignoreHTTPSErrors: true,
    })
  } else {
    // Local development
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
}

export async function closeBrowser(browser: Browser) {
  if (browser) {
    await browser.close()
  }
}

export async function analyzePage(url: string, targetKeyword?: string) {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    // Extract SEO data
    const seoData = await page.evaluate((keyword) => {
      // Helper: count keyword occurrences
      function countKeyword(text: string, kw: string): number {
        if (!kw) return 0
        const regex = new RegExp(kw, 'gi')
        return (text.match(regex) || []).length
      }

      // Helper: calculate keyword density
      function getKeywordDensity(text: string, kw: string): number {
        if (!kw) return 0
        const words = text.split(/\s+/).length
        const kwCount = countKeyword(text, kw)
        return words > 0 ? (kwCount / words) * 100 : 0
      }

      const bodyText = document.body.innerText || ''
      const bodyHTML = document.body.innerHTML || ''

      return {
        // Basic SEO elements
        title: document.title || '',
        metaDescription:
          document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        canonicalUrl: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',

        // Headings
        h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim() || ''),
        h2: Array.from(document.querySelectorAll('h2')).map((h) => h.textContent?.trim() || ''),

        // Content metrics
        wordCount: bodyText.split(/\s+/).filter((w) => w.length > 0).length,
        paragraphCount: document.querySelectorAll('p').length,

        // Images
        images: Array.from(document.querySelectorAll('img')).map((img) => ({
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth || 0,
          height: img.naturalHeight || 0,
        })),

        // Links
        links: Array.from(document.querySelectorAll('a')).map((a) => ({
          href: a.href,
          text: a.textContent?.trim() || '',
          rel: a.rel,
        })),

        // Meta tags
        hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
        hasMetaRobots: !!document.querySelector('meta[name="robots"]'),
        metaRobots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',

        // OpenGraph
        hasOgTags: !!document.querySelector('meta[property^="og:"]'),

        // Twitter Cards
        hasTwitterTags: !!document.querySelector('meta[name^="twitter:"]'),

        // Schema.org
        schemaScripts: Array.from(
          document.querySelectorAll('script[type="application/ld+json"]')
        ).map((script) => {
          try {
            return JSON.parse(script.textContent || '')
          } catch {
            return null
          }
        }),

        // Keyword analysis (if provided)
        keyword: keyword
          ? {
              inTitle: keyword ? countKeyword(document.title, keyword) > 0 : false,
              inH1: keyword
                ? Array.from(document.querySelectorAll('h1')).some((h) =>
                    countKeyword(h.textContent || '', keyword)
                  )
                : false,
              inMeta: keyword
                ? countKeyword(
                    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                      '',
                    keyword
                  ) > 0
                : false,
              inUrl: keyword ? countKeyword(window.location.href, keyword) > 0 : false,
              density: keyword ? getKeywordDensity(bodyText, keyword) : 0,
              count: keyword ? countKeyword(bodyText, keyword) : 0,
            }
          : null,
      }
    }, targetKeyword || '')

    return seoData
  } finally {
    await closeBrowser(browser)
  }
}
