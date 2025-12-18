import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Tool definitions for Claude to query the database
export const tools: Anthropic.Tool[] = [
  {
    name: 'get_user_projects',
    description: 'Get all projects for the current user with their domains and settings. Always call this first to understand what projects exist.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_project_details',
    description: 'Get detailed information about a specific project including domain, target location, and all associated data counts',
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
    name: 'get_project_keywords',
    description: 'Get all keywords for a specific project with their metrics (search volume, competition, CPC, keyword difficulty)',
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
    description: 'Get historical ranking data for a keyword showing position changes over time',
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
    name: 'get_latest_rankings',
    description: 'Get the most recent ranking positions for all keywords in a project',
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
    name: 'get_backlinks',
    description: 'Get backlink data for a project including source URLs, anchor texts, dofollow/nofollow status, and domain authority',
    input_schema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The UUID of the project',
        },
        include_lost: {
          type: 'boolean',
          description: 'Whether to include lost backlinks (default false)',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_competitors',
    description: 'Get competitors configured for a project',
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
    description: 'Get Google Search Console data for a project including clicks, impressions, CTR, and average position',
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
    description: 'Analyze keyword performance and provide insights including average position, top rankings, and keyword distribution',
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
    name: 'analyze_backlink_profile',
    description: 'Analyze the backlink profile of a project including referring domains, dofollow ratio, anchor text distribution',
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
    description: 'Analyze on-page SEO for a specific URL. Returns title, meta description, headings, word count, image alt text analysis, internal/external links, schema markup, and keyword optimization if target keyword provided.',
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
  {
    name: 'get_seo_summary',
    description: 'Get a comprehensive SEO summary for a project including keyword stats, ranking distribution, backlink overview, and trends',
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
]
