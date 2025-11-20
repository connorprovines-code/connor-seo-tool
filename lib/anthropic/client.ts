import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Tool definitions for Claude to query the database
export const tools: Anthropic.Tool[] = [
  {
    name: 'get_project_keywords',
    description: 'Get all keywords for a specific project with their metrics',
    input_schema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the project',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_ranking_history',
    description: 'Get historical ranking data for a keyword',
    input_schema: {
      type: 'object',
      properties: {
        keyword_id: {
          type: 'string',
          description: 'The UUID of the keyword',
        },
        days: {
          type: 'number',
          description: 'Number of days of history to retrieve (default 30)',
        },
      },
      required: ['keyword_id'],
    },
  },
  {
    name: 'get_user_projects',
    description: 'Get all projects for the current user',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_backlinks',
    description: 'Get backlink data for a project',
    input_schema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the project',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_gsc_data',
    description: 'Get Google Search Console data for a project',
    input_schema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the project',
        },
        days: {
          type: 'number',
          description: 'Number of days of data to retrieve (default 30)',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'analyze_keyword_performance',
    description: 'Analyze keyword performance and provide insights',
    input_schema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the project',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'analyze_page_seo',
    description: 'Analyze on-page SEO for a specific URL using Puppeteer. Returns title, meta description, headings, word count, image alt text analysis, internal/external links, schema markup, and keyword optimization if target keyword provided. Works with JavaScript-heavy sites (React, Vue, etc).',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to analyze (e.g., https://example.com/page)',
        },
        project_id: {
          type: 'string',
          description: 'Optional project ID to associate this audit with',
        },
        target_keyword: {
          type: 'string',
          description: 'Optional keyword to analyze keyword optimization (checks if keyword appears in title, H1, meta, URL, and calculates density)',
        },
      },
      required: ['url'],
    },
  },
]
