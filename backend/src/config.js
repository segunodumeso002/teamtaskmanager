export function getConfig() {
  return {
    region: process.env.AWS_REGION || 'us-east-1',
    dataMode: process.env.DATA_MODE || 'memory',
    authMode: process.env.AUTH_MODE || 'dev',
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
    cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
    tables: {
      users: process.env.DDB_TABLE_USERS || 'ttm-users-dev',
      projects: process.env.DDB_TABLE_PROJECTS || 'ttm-projects-dev',
      projectMembers: process.env.DDB_TABLE_PROJECT_MEMBERS || 'ttm-project-members-dev',
      tasks: process.env.DDB_TABLE_TASKS || 'ttm-tasks-dev',
      comments: process.env.DDB_TABLE_COMMENTS || 'ttm-comments-dev',
    },
  }
}
