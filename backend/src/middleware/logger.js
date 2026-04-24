const morgan = require('morgan');

// Custom morgan token to log tenantId if available
morgan.token('tenant', (req) => req.tenantId || 'NO_TENANT');
morgan.token('user', (req) => (req.user ? req.user.userId : 'GUEST'));

// Custom log format string
const logFormat = ':method :url :status :res[content-length] - :response-time ms | Tenant: :tenant | User: :user';

const requestLogger = morgan(logFormat);

module.exports = requestLogger;
