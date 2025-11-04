import pool from '../config/database.js';

/**
 * Engagement Prediction Service
 * Analyzes historical Instagram data to predict engagement and provide recommendations
 * Uses basic statistical analysis and pattern recognition
 */

class EngagementPredictionService {
  /**
   * Get comprehensive predictions for a DJ's Instagram account
   * @param {number} djId - DJ ID
   * @returns {Object} Predictions and recommendations
   */
  async getPredictions(djId) {
    try {
      // Get historical snapshots (last 90 days)
      const snapshots = await this.getHistoricalSnapshots(djId, 90);

      if (snapshots.length < 3) {
        return {
          success: false,
          message: 'Insufficient historical data. At least 3 snapshots are needed for predictions.',
          minimumDataRequired: true
        };
      }

      // Run all prediction analyses
      const [
        growthTrend,
        engagementTrend,
        optimalPostingTimes,
        hashtagPerformance,
        contentRecommendations,
        futureProjections
      ] = await Promise.all([
        this.analyzeGrowthTrend(snapshots),
        this.analyzeEngagementTrend(snapshots),
        this.predictOptimalPostingTimes(djId),
        this.analyzeHashtagPerformance(djId),
        this.generateContentRecommendations(djId, snapshots),
        this.projectFutureMetrics(snapshots)
      ]);

      return {
        success: true,
        data: {
          growthTrend,
          engagementTrend,
          optimalPostingTimes,
          hashtagPerformance,
          contentRecommendations,
          futureProjections,
          dataQuality: this.assessDataQuality(snapshots),
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating predictions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get historical snapshots from database
   */
  async getHistoricalSnapshots(djId, days = 90) {
    const result = await pool.query(
      `SELECT
        id,
        followers,
        engagement,
        data,
        created_at
      FROM social_media_snapshots
      WHERE dj_id = $1
        AND platform = 'instagram'
        AND created_at > NOW() - INTERVAL '${days} days'
      ORDER BY created_at ASC`,
      [djId]
    );

    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));
  }

  /**
   * Analyze follower growth trend
   */
  async analyzeGrowthTrend(snapshots) {
    const followers = snapshots.map(s => ({
      date: s.created_at,
      count: s.followers || s.data.followers || s.data.metrics?.followers || 0
    }));

    // Calculate growth rate
    const first = followers[0].count;
    const last = followers[followers.length - 1].count;
    const growthRate = first > 0 ? ((last - first) / first) * 100 : 0;

    // Calculate daily average growth
    const daysDiff = (new Date(followers[followers.length - 1].date) - new Date(followers[0].date)) / (1000 * 60 * 60 * 24);
    const avgDailyGrowth = daysDiff > 0 ? (last - first) / daysDiff : 0;

    // Detect trend direction using linear regression
    const trend = this.calculateLinearRegression(followers.map((f, i) => ({ x: i, y: f.count })));

    return {
      current: last,
      growthRate: parseFloat(growthRate.toFixed(2)),
      avgDailyGrowth: Math.round(avgDailyGrowth),
      trend: trend.slope > 0 ? 'ascending' : trend.slope < 0 ? 'descending' : 'stable',
      trendStrength: this.calculateTrendStrength(trend.slope, followers),
      prediction: trend.slope > 0 ? 'positive' : trend.slope < 0 ? 'negative' : 'neutral',
      confidence: this.calculateConfidence(followers)
    };
  }

  /**
   * Analyze engagement rate trend
   */
  async analyzeEngagementTrend(snapshots) {
    const engagements = snapshots.map(s => ({
      date: s.created_at,
      rate: s.engagement || s.data.engagement_rate || s.data.metrics?.engagement_rate || 0
    })).filter(e => e.rate > 0);

    if (engagements.length === 0) {
      return {
        current: 0,
        trend: 'unknown',
        prediction: 'insufficient_data'
      };
    }

    const first = engagements[0].rate;
    const last = engagements[engagements.length - 1].rate;
    const avgEngagement = engagements.reduce((sum, e) => sum + e.rate, 0) / engagements.length;

    // Calculate trend
    const trend = this.calculateLinearRegression(engagements.map((e, i) => ({ x: i, y: e.rate })));

    // Engagement benchmarks (industry standards for Instagram)
    const benchmarks = {
      excellent: 5.0,
      good: 3.0,
      average: 1.5,
      poor: 0.5
    };

    let performanceLevel = 'poor';
    if (last >= benchmarks.excellent) performanceLevel = 'excellent';
    else if (last >= benchmarks.good) performanceLevel = 'good';
    else if (last >= benchmarks.average) performanceLevel = 'average';

    return {
      current: parseFloat(last.toFixed(2)),
      average: parseFloat(avgEngagement.toFixed(2)),
      trend: trend.slope > 0 ? 'improving' : trend.slope < 0 ? 'declining' : 'stable',
      performanceLevel,
      benchmarks,
      changeRate: first > 0 ? parseFloat((((last - first) / first) * 100).toFixed(2)) : 0,
      prediction: trend.slope > 0 ? 'will_improve' : trend.slope < 0 ? 'needs_attention' : 'stable'
    };
  }

  /**
   * Predict optimal posting times based on post performance
   */
  async predictOptimalPostingTimes(djId) {
    const result = await pool.query(
      `SELECT data
       FROM social_media_snapshots
       WHERE dj_id = $1
         AND platform = 'instagram'
         AND created_at > NOW() - INTERVAL '60 days'
       ORDER BY created_at DESC
       LIMIT 20`,
      [djId]
    );

    if (result.rows.length === 0) {
      return {
        recommendation: 'Datos insuficientes',
        bestTimes: []
      };
    }

    // Extract posts from snapshots
    const allPosts = [];
    result.rows.forEach(row => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      const posts = data.recent_posts || [];
      posts.forEach(post => {
        if (post.timestamp) {
          allPosts.push({
            timestamp: post.timestamp,
            likes: post.likes || 0,
            comments: post.comments || 0,
            engagement: (post.likes || 0) + (post.comments || 0)
          });
        }
      });
    });

    if (allPosts.length < 5) {
      return {
        recommendation: 'Se necesitan más posts para análisis de horarios',
        bestTimes: []
      };
    }

    // Analyze performance by hour and day of week
    const hourPerformance = {};
    const dayPerformance = {};

    allPosts.forEach(post => {
      const date = new Date(post.timestamp * 1000);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday

      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { totalEngagement: 0, count: 0 };
      }
      hourPerformance[hour].totalEngagement += post.engagement;
      hourPerformance[hour].count += 1;

      if (!dayPerformance[day]) {
        dayPerformance[day] = { totalEngagement: 0, count: 0 };
      }
      dayPerformance[day].totalEngagement += post.engagement;
      dayPerformance[day].count += 1;
    });

    // Calculate average engagement per hour
    const hourAverages = Object.entries(hourPerformance).map(([hour, data]) => ({
      hour: parseInt(hour),
      avgEngagement: data.totalEngagement / data.count,
      postCount: data.count
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Calculate average engagement per day
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayAverages = Object.entries(dayPerformance).map(([day, data]) => ({
      day: parseInt(day),
      dayName: dayNames[day],
      avgEngagement: data.totalEngagement / data.count,
      postCount: data.count
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);

    return {
      bestHours: hourAverages.slice(0, 3).map(h => ({
        hour: h.hour,
        timeRange: `${h.hour}:00 - ${h.hour + 1}:00`,
        avgEngagement: Math.round(h.avgEngagement),
        postsAnalyzed: h.postCount
      })),
      bestDays: dayAverages.slice(0, 3).map(d => ({
        day: d.dayName,
        avgEngagement: Math.round(d.avgEngagement),
        postsAnalyzed: d.postCount
      })),
      recommendation: `Los mejores momentos para publicar son ${hourAverages[0].hour}:00-${hourAverages[0].hour + 1}:00, ${hourAverages[1].hour}:00-${hourAverages[1].hour + 1}:00, y ${hourAverages[2].hour}:00-${hourAverages[2].hour + 1}:00. Los mejores días son ${dayAverages[0].dayName}, ${dayAverages[1].dayName}, y ${dayAverages[2].dayName}.`,
      dataQuality: allPosts.length >= 20 ? 'high' : allPosts.length >= 10 ? 'medium' : 'low',
      postsAnalyzed: allPosts.length
    };
  }

  /**
   * Analyze hashtag performance
   */
  async analyzeHashtagPerformance(djId) {
    const result = await pool.query(
      `SELECT data
       FROM social_media_snapshots
       WHERE dj_id = $1
         AND platform = 'instagram'
         AND created_at > NOW() - INTERVAL '60 days'
       ORDER BY created_at DESC
       LIMIT 15`,
      [djId]
    );

    if (result.rows.length === 0) {
      return {
        topPerformers: [],
        recommendation: 'No hay datos suficientes de hashtags'
      };
    }

    // Extract hashtags and their performance
    const hashtagStats = {};

    result.rows.forEach(row => {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      const posts = data.recent_posts || [];

      posts.forEach(post => {
        const caption = post.caption || post.text || '';
        const hashtags = this.extractHashtags(caption);
        const engagement = (post.likes || 0) + (post.comments || 0);

        hashtags.forEach(tag => {
          if (!hashtagStats[tag]) {
            hashtagStats[tag] = {
              totalEngagement: 0,
              count: 0,
              engagements: []
            };
          }
          hashtagStats[tag].totalEngagement += engagement;
          hashtagStats[tag].count += 1;
          hashtagStats[tag].engagements.push(engagement);
        });
      });
    });

    // Calculate performance metrics
    const hashtagPerformance = Object.entries(hashtagStats)
      .filter(([_, stats]) => stats.count >= 2) // At least 2 uses
      .map(([hashtag, stats]) => ({
        hashtag,
        avgEngagement: Math.round(stats.totalEngagement / stats.count),
        timesUsed: stats.count,
        consistency: this.calculateConsistency(stats.engagements),
        score: (stats.totalEngagement / stats.count) * Math.min(stats.count / 5, 1) // Favor frequently used tags
      }))
      .sort((a, b) => b.score - a.score);

    const topPerformers = hashtagPerformance.slice(0, 10);
    const underperformers = hashtagPerformance.slice(-5);

    return {
      topPerformers: topPerformers.map(h => ({
        hashtag: h.hashtag,
        avgEngagement: h.avgEngagement,
        timesUsed: h.timesUsed,
        consistency: h.consistency
      })),
      recommendation: topPerformers.length > 0
        ? `Continúa usando: ${topPerformers.slice(0, 3).map(h => h.hashtag).join(', ')}. ${underperformers.length > 0 ? `Considera reemplazar: ${underperformers.slice(0, 2).map(h => h.hashtag).join(', ')}.` : ''}`
        : 'Usa hashtags relevantes en tus posts para mejorar el alcance.',
      totalHashtagsAnalyzed: Object.keys(hashtagStats).length
    };
  }

  /**
   * Generate content recommendations based on historical performance
   */
  async generateContentRecommendations(djId, snapshots) {
    const recommendations = [];

    // Analyze posting frequency
    const daysDiff = (new Date(snapshots[snapshots.length - 1].created_at) - new Date(snapshots[0].created_at)) / (1000 * 60 * 60 * 24);
    const totalPosts = snapshots[snapshots.length - 1].data.metrics?.posts || 0;
    const firstPosts = snapshots[0].data.metrics?.posts || 0;
    const newPosts = totalPosts - firstPosts;
    const avgPostsPerWeek = daysDiff > 0 ? (newPosts / daysDiff) * 7 : 0;

    if (avgPostsPerWeek < 3) {
      recommendations.push({
        type: 'frequency',
        priority: 'high',
        title: 'Aumenta tu frecuencia de publicación',
        description: `Actualmente publicas ~${avgPostsPerWeek.toFixed(1)} veces por semana. El ideal es 4-7 posts semanales para mantener engagement.`,
        action: 'Planifica más contenido regularmente'
      });
    } else if (avgPostsPerWeek > 14) {
      recommendations.push({
        type: 'frequency',
        priority: 'medium',
        title: 'Considera reducir frecuencia',
        description: `Publicas ~${avgPostsPerWeek.toFixed(1)} veces por semana. Demasiados posts pueden saturar a tu audiencia.`,
        action: 'Enfócate en calidad sobre cantidad'
      });
    } else {
      recommendations.push({
        type: 'frequency',
        priority: 'low',
        title: 'Frecuencia de publicación óptima',
        description: `Tu frecuencia de ~${avgPostsPerWeek.toFixed(1)} posts semanales es excelente.`,
        action: 'Mantén este ritmo de publicación'
      });
    }

    // Analyze engagement rate trend
    const engagements = snapshots.map(s => s.data.metrics?.engagement_rate || 0).filter(e => e > 0);
    if (engagements.length >= 3) {
      const recent = engagements.slice(-3);
      const older = engagements.slice(0, 3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      if (recentAvg < olderAvg * 0.8) {
        recommendations.push({
          type: 'engagement',
          priority: 'high',
          title: 'Engagement está disminuyendo',
          description: 'Tu tasa de engagement ha bajado significativamente en las últimas semanas.',
          action: 'Experimenta con nuevo contenido, stories, y responde a comentarios'
        });
      } else if (recentAvg > olderAvg * 1.2) {
        recommendations.push({
          type: 'engagement',
          priority: 'low',
          title: 'Engagement está creciendo',
          description: '¡Tu contenido reciente está funcionando muy bien!',
          action: 'Analiza qué está funcionando y repite el formato'
        });
      }
    }

    // Check for stagnant follower growth
    const followers = snapshots.map(s => s.followers || s.data.followers || s.data.metrics?.followers || 0);
    const recentFollowers = followers.slice(-5);
    const followerGrowth = recentFollowers.length > 1
      ? recentFollowers[recentFollowers.length - 1] - recentFollowers[0]
      : 0;

    if (followerGrowth < 10 && snapshots.length >= 5) {
      recommendations.push({
        type: 'growth',
        priority: 'medium',
        title: 'Crecimiento de seguidores lento',
        description: 'Has ganado pocos seguidores recientemente.',
        action: 'Usa más hashtags relevantes, colabora con otros DJs, y promociona tu Instagram'
      });
    }

    return recommendations;
  }

  /**
   * Project future metrics based on trends
   */
  async projectFutureMetrics(snapshots) {
    if (snapshots.length < 3) {
      return {
        available: false,
        message: 'Insufficient data for projections'
      };
    }

    const followers = snapshots.map((s, i) => ({
      x: i,
      y: s.followers || s.data.followers || s.data.metrics?.followers || 0
    }));

    const engagement = snapshots.map((s, i) => ({
      x: i,
      y: s.engagement || s.data.engagement_rate || s.data.metrics?.engagement_rate || 0
    })).filter(e => e.y > 0);

    // Calculate trends
    const followerTrend = this.calculateLinearRegression(followers);
    const engagementTrend = engagement.length >= 3 ? this.calculateLinearRegression(engagement) : null;

    // Project 30 days ahead
    const daysPerSnapshot = snapshots.length > 1
      ? (new Date(snapshots[snapshots.length - 1].created_at) - new Date(snapshots[0].created_at)) / (1000 * 60 * 60 * 24) / (snapshots.length - 1)
      : 1;

    const snapshotsAhead = Math.ceil(30 / daysPerSnapshot);
    const futureIndex = followers.length + snapshotsAhead;

    const projectedFollowers = Math.round(followerTrend.slope * futureIndex + followerTrend.intercept);
    const currentFollowers = followers[followers.length - 1].y;

    let projectedEngagement = null;
    if (engagementTrend) {
      projectedEngagement = parseFloat((engagementTrend.slope * futureIndex + engagementTrend.intercept).toFixed(2));
    }

    return {
      available: true,
      timeframe: '30 days',
      followers: {
        current: currentFollowers,
        projected: Math.max(currentFollowers, projectedFollowers), // Don't project negative growth
        change: projectedFollowers - currentFollowers,
        changePercent: currentFollowers > 0
          ? parseFloat((((projectedFollowers - currentFollowers) / currentFollowers) * 100).toFixed(1))
          : 0
      },
      engagement: engagementTrend ? {
        current: engagement[engagement.length - 1].y,
        projected: Math.max(0, projectedEngagement),
        trend: engagementTrend.slope > 0 ? 'improving' : 'declining'
      } : null,
      confidence: this.calculateConfidence(followers)
    };
  }

  // ========== HELPER METHODS ==========

  /**
   * Calculate linear regression (y = mx + b)
   */
  calculateLinearRegression(points) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate trend strength (0-1)
   */
  calculateTrendStrength(slope, data) {
    if (data.length < 2) return 0;

    const values = data.map(d => d.count);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;

    if (range === 0) return 0;

    const normalizedSlope = Math.abs(slope) / range;
    return Math.min(parseFloat(normalizedSlope.toFixed(2)), 1);
  }

  /**
   * Calculate confidence level based on data consistency
   */
  calculateConfidence(data) {
    if (data.length < 5) return 'low';
    if (data.length < 15) return 'medium';
    return 'high';
  }

  /**
   * Calculate consistency score for a set of values (0-1)
   */
  calculateConsistency(values) {
    if (values.length < 2) return 0;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower coefficient of variation = higher consistency
    const cv = avg > 0 ? stdDev / avg : 1;
    return Math.max(0, 1 - Math.min(cv, 1));
  }

  /**
   * Extract hashtags from text
   */
  extractHashtags(text) {
    if (!text) return [];
    const hashtagRegex = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g;
    const matches = text.match(hashtagRegex) || [];
    return [...new Set(matches.map(tag => tag.toLowerCase()))];
  }

  /**
   * Assess overall data quality
   */
  assessDataQuality(snapshots) {
    const score = Math.min(snapshots.length / 20, 1); // Ideal: 20+ snapshots

    if (score >= 0.8) return { level: 'high', description: 'Datos suficientes para predicciones precisas' };
    if (score >= 0.4) return { level: 'medium', description: 'Datos moderados, predicciones con confianza media' };
    return { level: 'low', description: 'Datos limitados, las predicciones pueden variar' };
  }
}

export default new EngagementPredictionService();
