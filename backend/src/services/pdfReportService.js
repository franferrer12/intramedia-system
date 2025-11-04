import PDFDocument from 'pdfkit';
import pool from '../config/database.js';

/**
 * PDF Report Generation Service
 * Generates professional Instagram analytics reports
 */

class PDFReportService {
  /**
   * Generate Instagram analytics PDF report for a DJ
   * @param {number} djId - DJ ID
   * @param {Object} instagramData - Instagram metrics data
   * @returns {PDFDocument} PDF stream
   */
  async generateInstagramReport(djId, instagramData) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Instagram Analytics Report - ${instagramData.profile?.username || 'DJ'}`,
        Author: 'Intra Media System',
        Subject: 'Instagram Analytics',
        Keywords: 'instagram, analytics, metrics, social media'
      }
    });

    // Get DJ info from database
    const djInfo = await this.getDJInfo(djId);

    // Document content
    this.addHeader(doc, djInfo, instagramData);
    this.addMetricsSummary(doc, instagramData);
    this.addEngagementSection(doc, instagramData);
    this.addTopPostsSection(doc, instagramData);
    this.addFooter(doc);

    // Finalize PDF
    doc.end();

    return doc;
  }

  /**
   * Get DJ information from database
   */
  async getDJInfo(djId) {
    try {
      const result = await pool.query(
        'SELECT id, nombre, email FROM djs WHERE id = $1',
        [djId]
      );
      return result.rows[0] || { nombre: 'DJ', email: '' };
    } catch (error) {
      console.error('Error fetching DJ info:', error);
      return { nombre: 'DJ', email: '' };
    }
  }

  /**
   * Add header section with logo and title
   */
  addHeader(doc, djInfo, instagramData) {
    const now = new Date();
    const username = instagramData.profile?.username || instagramData.username || 'unknown';

    // Title
    doc
      .fontSize(24)
      .fillColor('#E1306C')
      .text('Instagram Analytics Report', 50, 50, { align: 'center' });

    // DJ Name
    doc
      .fontSize(16)
      .fillColor('#333333')
      .text(`DJ: ${djInfo.nombre}`, 50, 90, { align: 'center' });

    // Instagram username
    doc
      .fontSize(14)
      .fillColor('#666666')
      .text(`@${username}`, 50, 115, { align: 'center' });

    // Date
    doc
      .fontSize(10)
      .fillColor('#999999')
      .text(
        `Generado: ${now.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`,
        50,
        140,
        { align: 'center' }
      );

    // Separator line
    doc
      .moveTo(50, 160)
      .lineTo(545, 160)
      .strokeColor('#E1306C')
      .lineWidth(2)
      .stroke();

    doc.moveDown(3);
  }

  /**
   * Add metrics summary section
   */
  addMetricsSummary(doc, instagramData) {
    const metrics = instagramData.metrics || {};
    const currentY = 180;

    // Section title
    doc
      .fontSize(16)
      .fillColor('#333333')
      .text('Resumen de Métricas', 50, currentY);

    // Metrics cards
    const metricsData = [
      {
        label: 'Seguidores',
        value: this.formatNumber(metrics.followers || 0),
        color: '#4A90E2'
      },
      {
        label: 'Siguiendo',
        value: this.formatNumber(metrics.following || 0),
        color: '#7B68EE'
      },
      {
        label: 'Posts',
        value: this.formatNumber(metrics.posts || 0),
        color: '#E1306C'
      },
      {
        label: 'Engagement Rate',
        value: `${(metrics.engagement_rate || 0).toFixed(2)}%`,
        color: '#50C878'
      },
      {
        label: 'Likes Promedio',
        value: this.formatNumber(metrics.avg_likes || 0),
        color: '#FF6B6B'
      },
      {
        label: 'Ratio Followers',
        value: metrics.following > 0
          ? `${(metrics.followers / metrics.following).toFixed(2)}x`
          : 'N/A',
        color: '#FFA500'
      }
    ];

    let cardY = currentY + 30;
    const cardWidth = 150;
    const cardHeight = 60;
    const cardsPerRow = 3;
    const cardSpacing = 20;

    metricsData.forEach((metric, index) => {
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const x = 50 + col * (cardWidth + cardSpacing);
      const y = cardY + row * (cardHeight + 15);

      // Card background
      doc
        .rect(x, y, cardWidth, cardHeight)
        .fillAndStroke('#F8F9FA', '#E0E0E0');

      // Metric value
      doc
        .fontSize(20)
        .fillColor(metric.color)
        .text(metric.value, x + 10, y + 10, {
          width: cardWidth - 20,
          align: 'center'
        });

      // Metric label
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(metric.label, x + 10, y + 38, {
          width: cardWidth - 20,
          align: 'center'
        });
    });

    doc.moveDown(12);
  }

  /**
   * Add engagement analysis section
   */
  addEngagementSection(doc, instagramData) {
    const metrics = instagramData.metrics || {};
    const engagementRate = metrics.engagement_rate || 0;
    const currentY = doc.y + 20;

    // Section title
    doc
      .fontSize(16)
      .fillColor('#333333')
      .text('Análisis de Engagement', 50, currentY);

    // Engagement description
    let engagementText = '';
    let engagementColor = '#666666';

    if (engagementRate >= 3) {
      engagementText = '¡Excelente! Tu engagement está por encima del promedio de la industria (1-3%). Sigue creando contenido de calidad.';
      engagementColor = '#50C878';
    } else if (engagementRate >= 1) {
      engagementText = 'Bueno. Tu engagement está dentro del promedio de la industria. Considera aumentar la frecuencia de posts y usar hashtags relevantes.';
      engagementColor = '#FFA500';
    } else {
      engagementText = 'Hay oportunidad de mejora. Intenta publicar contenido más interactivo y en horarios de mayor actividad de tu audiencia.';
      engagementColor = '#FF6B6B';
    }

    doc
      .fontSize(11)
      .fillColor(engagementColor)
      .text(engagementText, 50, currentY + 30, {
        width: 495,
        align: 'justify'
      });

    // Engagement bar
    const barY = currentY + 80;
    const barWidth = 400;
    const barHeight = 20;
    const fillWidth = Math.min((engagementRate / 5) * barWidth, barWidth);

    // Bar background
    doc
      .rect(50, barY, barWidth, barHeight)
      .fillAndStroke('#F0F0F0', '#D0D0D0');

    // Bar fill
    doc
      .rect(50, barY, fillWidth, barHeight)
      .fillAndStroke(engagementColor);

    // Percentage text
    doc
      .fontSize(12)
      .fillColor('#333333')
      .text(`${engagementRate.toFixed(2)}%`, 460, barY + 3);

    // Benchmarks
    doc
      .fontSize(9)
      .fillColor('#999999')
      .text('Benchmarks de la industria:', 50, barY + 30)
      .text('• Engagement Rate: 1-3% es promedio para DJs', 50, barY + 45)
      .text('• Ratio Followers: 2x+ es ideal', 50, barY + 60)
      .text('• Frecuencia: 3-5 posts por semana', 50, barY + 75);

    doc.moveDown(8);
  }

  /**
   * Add top posts section
   */
  addTopPostsSection(doc, instagramData) {
    const topPost = instagramData.top_post;
    const recentPosts = instagramData.recent_posts || [];
    const currentY = doc.y + 20;

    // Check if we need a new page
    if (currentY > 650) {
      doc.addPage();
    }

    // Section title
    doc
      .fontSize(16)
      .fillColor('#333333')
      .text('Contenido Destacado', 50, doc.y);

    if (topPost) {
      doc.moveDown(1);
      doc
        .fontSize(14)
        .fillColor('#E1306C')
        .text('🏆 Post con Mayor Engagement:', 50, doc.y);

      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor('#666666')
        .text(topPost.caption ? topPost.caption.substring(0, 150) + '...' : 'Sin descripción', 60, doc.y, {
          width: 485,
          align: 'left'
        });

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor('#999999')
        .text(
          `❤️ ${this.formatNumber(topPost.likes || 0)} likes  💬 ${this.formatNumber(topPost.comments || 0)} comentarios`,
          60,
          doc.y
        );
    }

    // Recent posts summary
    if (recentPosts.length > 0) {
      doc.moveDown(1.5);
      doc
        .fontSize(14)
        .fillColor('#333333')
        .text(`Resumen de ${recentPosts.length} Posts Recientes:`, 50, doc.y);

      const totalLikes = recentPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = recentPosts.reduce((sum, post) => sum + (post.comments || 0), 0);
      const avgEngagement = recentPosts.length > 0
        ? ((totalLikes + totalComments) / recentPosts.length)
        : 0;

      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor('#666666')
        .text(`• Total de likes: ${this.formatNumber(totalLikes)}`, 60, doc.y);

      doc.moveDown(0.3);
      doc.text(`• Total de comentarios: ${this.formatNumber(totalComments)}`, 60, doc.y);

      doc.moveDown(0.3);
      doc.text(`• Engagement promedio por post: ${this.formatNumber(avgEngagement)}`, 60, doc.y);
    } else {
      doc.moveDown(1);
      doc
        .fontSize(11)
        .fillColor('#999999')
        .text('No hay posts recientes disponibles para análisis.', 60, doc.y);
    }

    doc.moveDown(2);
  }

  /**
   * Add footer with generation info
   */
  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Footer line
      doc
        .moveTo(50, 770)
        .lineTo(545, 770)
        .strokeColor('#E0E0E0')
        .lineWidth(1)
        .stroke();

      // Footer text
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          'Intra Media System - Instagram Analytics Report',
          50,
          780,
          { align: 'center', width: 495 }
        );

      doc.text(`Página ${i + 1} de ${pageCount}`, 50, 790, {
        align: 'center',
        width: 495
      });
    }
  }

  /**
   * Format number with K/M suffix
   */
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
}

export default new PDFReportService();
