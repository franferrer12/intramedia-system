/**
 * Artillery Processor
 * Custom functions for load testing scenarios
 */

export default {
  /**
   * Setup function - runs before tests
   */
  beforeScenario(requestParams, context, ee, next) {
    // Set context variables
    context.vars.timestamp = Date.now();
    return next();
  },

  /**
   * Teardown function - runs after tests
   */
  afterScenario(requestParams, context, ee, next) {
    // Cleanup logic if needed
    return next();
  },

  /**
   * Log response times for analysis
   */
  logResponseTime(requestParams, response, context, ee, next) {
    if (response.statusCode !== 200) {
      console.log(`Non-200 response: ${response.statusCode} for ${requestParams.url}`);
    }
    return next();
  }
};
