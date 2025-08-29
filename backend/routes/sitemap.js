// server/routes/sitemap.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/sitemap.xml', async (req, res) => {
    try {
        const posts = await Post.find({
            $or: [
                { type: 'confession' },
                { type: 'news' },
                { type: 'event', status: 'approved' }
            ]
        }).sort({ updatedAt: -1 });

        // Base URL for your frontend
        const baseUrl = 'https://www.confique.com'; // Your domain name
        
        let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/events</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/confessions</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  ${posts.map(post => {
      const lastmod = (post.updatedAt || post.timestamp).toISOString();
      const priority = post.type === 'event' ? '0.7' : '0.6';
      
      return `
  <url>
    <loc>${baseUrl}/posts/${post._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('')}
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemapXml);
    } catch (error) {
        console.error('Failed to generate sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;