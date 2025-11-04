import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import './InstagramPostCard.css';

/**
 * Custom Instagram Post Card with Frames
 * Displays posts with professional DJ-themed styling
 */
const InstagramPostCard = ({ post, index }) => {
  const [imageError, setImageError] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  // Generate gradient based on post index for unique colors
  const getGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      'linear-gradient(135deg, #f8b195 0%, #f67280 100%)'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <motion.div
      className="instagram-post-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      {/* Outer Frame */}
      <div className="post-frame">
        {/* Inner Frame Border */}
        <div className="frame-border">
          {/* Image Container */}
          <div className="post-image-container">
            {!imageError && post.thumbnail_url ? (
              <img
                src={post.thumbnail_url}
                alt={post.caption}
                className="post-image"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div
                className="post-placeholder"
                style={{ background: getGradient(index) }}
              >
                <div className="placeholder-content">
                  <div className="music-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="placeholder-text">DJ POST</div>
                </div>
              </div>
            )}

            {/* Overlay with engagement stats */}
            <div className="post-overlay">
              <div className="engagement-stats">
                <div className="stat">
                  <Heart size={18} fill="white" />
                  <span>{formatNumber(post.likes)}</span>
                </div>
                <div className="stat">
                  <MessageCircle size={18} />
                  <span>{formatNumber(post.comments)}</span>
                </div>
              </div>
            </div>

            {/* Date Badge */}
            <div className="date-badge">
              <Calendar size={12} />
              <span>{formatDate(post.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Info */}
      <div className="post-info">
        <p className="post-caption">
          {post.caption?.substring(0, 80) || 'Sin descripción'}
          {post.caption?.length > 80 && '...'}
        </p>
        <div className="post-engagement">
          <div className="engagement-bar">
            <div
              className="engagement-fill"
              style={{
                width: `${Math.min(100, (post.engagement / (post.likes * 1.2)) * 100)}%`
              }}
            />
          </div>
          <div className="engagement-label">
            <TrendingUp size={12} />
            <span>{formatNumber(post.engagement)} interacciones</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InstagramPostCard;
