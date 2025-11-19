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
]
