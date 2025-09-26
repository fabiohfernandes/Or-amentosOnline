// Proposal Platform API Routes
// Phase 3A: Core Proposal Platform Implementation
// OrçamentosOnline - Simplified Proposal Platform Routes

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database pool (will be passed from main app)
let pool;

// Initialize pool
const initializePool = (dbPool) => {
  pool = dbPool;
};

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

// User authentication middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Client authentication middleware (for proposal viewing)
const authenticateClient = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const proposalId = req.params.id;

    if (!username || !password) {
      return res.status(401).json({
        success: false,
        error: 'Client credentials required'
      });
    }

    // Find proposal with matching client credentials
    const result = await pool.query(
      `SELECT id, client_username, client_password_hash, status
       FROM proposals
       WHERE (id = $1 OR public_token = $1) AND client_username = $2`,
      [proposalId, username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const proposal = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, proposal.client_password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if proposal is accessible
    if (proposal.status === 'archived') {
      return res.status(403).json({
        success: false,
        error: 'Proposal no longer accessible'
      });
    }

    req.proposalId = proposal.id;
    req.client = { username: proposal.client_username };
    next();
  } catch (error) {
    logger.error('Client authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// ============================================================================
// PROPOSAL MANAGEMENT ROUTES (User-facing)
// ============================================================================

// Get all proposals for authenticated user
router.get('/proposals', authenticateUser, async (req, res) => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        id,
        proposal_name,
        client_name,
        job_name,
        status,
        proposal_value,
        created_at,
        updated_at,
        closed_at,
        public_token,
        client_username,
        client_password_display
      FROM proposals
      WHERE user_id = $1
    `;

    const queryParams = [req.user.userId];
    let paramCount = 1;

    // Add status filter
    if (status && ['open', 'closed', 'archived'].includes(status)) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    // Add search filter
    if (search && search.trim()) {
      paramCount++;
      query += ` AND (
        proposal_name ILIKE $${paramCount} OR
        client_name ILIKE $${paramCount} OR
        job_name ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM proposals WHERE user_id = $1`;
    const countParams = [req.user.userId];

    if (status && ['open', 'closed', 'archived'].includes(status)) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        proposals: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposals'
    });
  }
});

// Create new proposal
router.post('/proposals', authenticateUser, async (req, res) => {
  try {
    const {
      proposalName,
      clientName,
      jobName,
      presentationUrl,
      commercialProposalUrl,
      scopeText,
      termsText,
      clientUsername,
      clientPassword,
      proposalValue
    } = req.body;

    // Validate required fields
    const requiredFields = {
      proposalName: 'Proposal name is required',
      clientName: 'Client name is required',
      jobName: 'Job name is required',
      scopeText: 'Scope text is required',
      termsText: 'Terms text is required',
      clientUsername: 'Client username is required',
      clientPassword: 'Client password is required'
    };

    const errors = [];
    Object.keys(requiredFields).forEach(field => {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        errors.push(requiredFields[field]);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Check if client username is unique
    const existingUsername = await pool.query(
      'SELECT id FROM proposals WHERE client_username = $1',
      [clientUsername]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Client username already exists. Please choose a different username.'
      });
    }

    // Hash client password for authentication
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(clientPassword, saltRounds);

    // Store plain password for display purposes (in real-world, this should be encrypted)
    const displayPassword = clientPassword;

    // Generate unique public token for client access
    const publicToken = uuidv4();

    // Use user_id directly (no organization structure in simplified schema)
    const userId = req.user.userId;

    // Create proposal
    const proposalResult = await pool.query(
      `INSERT INTO proposals (
        user_id,
        proposal_name,
        client_name,
        job_name,
        presentation_url,
        commercial_proposal_url,
        scope_text,
        terms_text,
        client_username,
        client_password_hash,
        client_password_display,
        proposal_value,
        status,
        public_token,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *`,
      [
        req.user.userId,
        proposalName.trim(),
        clientName.trim(),
        jobName.trim(),
        presentationUrl || null,
        commercialProposalUrl || null,
        scopeText.trim(),
        termsText.trim(),
        clientUsername.trim(),
        hashedPassword,
        displayPassword,
        proposalValue || 0,
        'open',
        publicToken
      ]
    );

    const proposal = proposalResult.rows[0];

    // Remove sensitive data before sending response
    delete proposal.client_password_hash;
    delete proposal.organization_id;

    logger.info(`Proposal created: ${proposal.id} by user ${req.user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      data: {
        proposal: {
          ...proposal,
          clientAccessUrl: `${process.env.FRONTEND_URL}/proposal/${proposal.public_token}`
        }
      }
    });
  } catch (error) {
    logger.error('Error creating proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create proposal'
    });
  }
});

// Get specific proposal (for editing)
router.get('/proposals/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        proposal_name,
        client_name,
        job_name,
        presentation_url,
        commercial_proposal_url,
        scope_text,
        terms_text,
        client_username,
        client_password_display,
        status,
        proposal_value,
        created_at,
        updated_at,
        closed_at,
        public_token
      FROM proposals
      WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const proposal = result.rows[0];

    res.json({
      success: true,
      data: {
        proposal: {
          ...proposal,
          clientAccessUrl: `${process.env.FRONTEND_URL}/proposal/${proposal.public_token}`
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal'
    });
  }
});

// Update proposal
router.put('/proposals/:id', authenticateUser, async (req, res) => {
  try {
    const {
      proposalName,
      clientName,
      jobName,
      presentationUrl,
      commercialProposalUrl,
      scopeText,
      termsText,
      clientUsername,
      clientPassword,
      proposalValue
    } = req.body;

    // Handle password update if provided
    let hashedPassword = null;
    let displayPassword = null;

    if (clientPassword && clientPassword.trim() !== '') {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(clientPassword, saltRounds);
      displayPassword = clientPassword;
    }

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    updateFields.push(`proposal_name = $${paramCount++}`);
    updateValues.push(proposalName?.trim());

    updateFields.push(`client_name = $${paramCount++}`);
    updateValues.push(clientName?.trim());

    updateFields.push(`job_name = $${paramCount++}`);
    updateValues.push(jobName?.trim());

    updateFields.push(`presentation_url = $${paramCount++}`);
    updateValues.push(presentationUrl || null);

    updateFields.push(`commercial_proposal_url = $${paramCount++}`);
    updateValues.push(commercialProposalUrl || null);

    updateFields.push(`scope_text = $${paramCount++}`);
    updateValues.push(scopeText?.trim());

    updateFields.push(`terms_text = $${paramCount++}`);
    updateValues.push(termsText?.trim());

    if (clientUsername && clientUsername.trim() !== '') {
      // Check if client username is unique (excluding current proposal)
      const existingUsername = await pool.query(
        'SELECT id FROM proposals WHERE client_username = $1 AND id != $2',
        [clientUsername.trim(), req.params.id]
      );

      if (existingUsername.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Client username already exists. Please choose a different username.'
        });
      }

      updateFields.push(`client_username = $${paramCount++}`);
      updateValues.push(clientUsername.trim());
    }

    if (hashedPassword) {
      updateFields.push(`client_password_hash = $${paramCount++}`);
      updateValues.push(hashedPassword);

      updateFields.push(`client_password_display = $${paramCount++}`);
      updateValues.push(displayPassword);
    }

    updateFields.push(`proposal_value = $${paramCount++}`);
    updateValues.push(proposalValue || 0);

    updateFields.push(`updated_at = NOW()`);

    // Add WHERE clause parameters
    updateValues.push(req.params.id);
    updateValues.push(req.user.userId);

    const result = await pool.query(
      `UPDATE proposals SET
        ${updateFields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *`,
      updateValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    const proposal = result.rows[0];
    delete proposal.client_password_hash;
    delete proposal.organization_id;

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      data: { proposal }
    });
  } catch (error) {
    logger.error('Error updating proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update proposal'
    });
  }
});

// Delete proposal
router.delete('/proposals/:id', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM proposals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete proposal'
    });
  }
});

// Get proposal analytics
router.get('/proposals/:id/analytics', authenticateUser, async (req, res) => {
  try {
    const analyticsResult = await pool.query(
      `SELECT
        page_name,
        COUNT(*) as views,
        SUM(time_spent_seconds) as total_time,
        AVG(time_spent_seconds) as avg_time,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM proposal_views pa
      INNER JOIN proposals p ON pa.proposal_id = p.id
      WHERE p.id = $1 AND p.user_id = $2
      GROUP BY page_name
      ORDER BY
        CASE page_name
          WHEN 'presentation' THEN 1
          WHEN 'commercial' THEN 2
          WHEN 'scope' THEN 3
          WHEN 'terms' THEN 4
        END`,
      [req.params.id, req.user.userId]
    );

    const commentsResult = await pool.query(
      `SELECT COUNT(*) as comment_count
      FROM client_comments cc
      INNER JOIN proposals p ON cc.proposal_id = p.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.userId]
    );

    res.json({
      success: true,
      data: {
        pageAnalytics: analyticsResult.rows,
        commentCount: parseInt(commentsResult.rows[0].comment_count),
        summary: {
          totalViews: analyticsResult.rows.reduce((sum, row) => sum + parseInt(row.views), 0),
          totalTime: analyticsResult.rows.reduce((sum, row) => sum + parseInt(row.total_time || 0), 0),
          uniqueSessions: analyticsResult.rows.length > 0 ? Math.max(...analyticsResult.rows.map(row => parseInt(row.unique_sessions))) : 0
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching proposal analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// ============================================================================
// CLIENT-FACING ROUTES (Proposal Viewing)
// ============================================================================

// Client login to proposal
router.post('/client/login/:id', async (req, res) => {
  try {
    const { username, password } = req.body;
    const proposalIdentifier = req.params.id; // Can be ID or public_token

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find proposal by ID or public token
    const proposalResult = await pool.query(
      `SELECT
        id,
        client_username,
        client_password_hash,
        status,
        proposal_name,
        client_name
      FROM proposals
      WHERE (id = $1 OR public_token = $1) AND client_username = $2`,
      [proposalIdentifier, username]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const proposal = proposalResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, proposal.client_password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check proposal status
    if (proposal.status === 'archived') {
      return res.status(403).json({
        success: false,
        error: 'This proposal is no longer accessible'
      });
    }

    // Generate client session token
    const clientToken = jwt.sign(
      {
        proposalId: proposal.id,
        username: proposal.client_username,
        type: 'client'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: clientToken,
        proposal: {
          id: proposal.id,
          name: proposal.proposal_name,
          clientName: proposal.client_name,
          status: proposal.status
        }
      }
    });
  } catch (error) {
    logger.error('Client login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get proposal content for client viewing
router.get('/client/proposal/:id', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify client token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Get proposal content
    const proposalResult = await pool.query(
      `SELECT
        id,
        proposal_name,
        client_name,
        job_name,
        presentation_url,
        commercial_proposal_url,
        scope_text,
        terms_text,
        status,
        proposal_value,
        public_token
      FROM proposals
      WHERE id = $1 AND status != 'archived'`,
      [decoded.proposalId]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found or no longer accessible'
      });
    }

    const proposal = proposalResult.rows[0];

    // Get existing comments
    const commentsResult = await pool.query(
      `SELECT
        id,
        comment_text,
        created_at
      FROM client_comments
      WHERE proposal_id = $1
      ORDER BY created_at DESC`,
      [proposal.id]
    );

    res.json({
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          proposal_name: proposal.proposal_name,
          client_name: proposal.client_name,
          job_name: proposal.job_name,
          presentation_url: proposal.presentation_url,
          commercial_proposal_url: proposal.commercial_proposal_url,
          scope_text: proposal.scope_text,
          terms_text: proposal.terms_text,
          status: proposal.status,
          proposal_value: proposal.proposal_value
        },
        comments: commentsResult.rows
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }

    logger.error('Error fetching client proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch proposal'
    });
  }
});

// Add client comment
router.post('/client/proposal/:id/comment', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { comment } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    // Verify client token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Add comment
    const commentResult = await pool.query(
      `INSERT INTO client_comments (
        proposal_id,
        comment_text,
        ip_address,
        created_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING *`,
      [decoded.proposalId, comment.trim(), req.ip]
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: commentResult.rows[0]
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }

    logger.error('Error adding client comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// Accept proposal (close deal)
router.post('/client/proposal/:id/accept', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify client token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'client') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // Update proposal status to closed
    const result = await pool.query(
      `UPDATE proposals
      SET status = 'closed', closed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'open'
      RETURNING *`,
      [decoded.proposalId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Proposal cannot be accepted (may already be closed or archived)'
      });
    }

    logger.info(`Proposal ${decoded.proposalId} accepted by client`);

    res.json({
      success: true,
      message: 'Proposal accepted successfully! The deal has been closed.',
      data: {
        proposal: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          closedAt: result.rows[0].closed_at
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    }

    logger.error('Error accepting proposal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept proposal'
    });
  }
});

// Track proposal analytics
router.post('/client/proposal/:id/analytics', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const {
      pageNumber,
      pageName,
      timeSpent,
      sessionId,
      deviceType,
      interactions,
      scrolledToBottom
    } = req.body;

    // Verify client token (optional for analytics)
    let proposalId;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        proposalId = decoded.proposalId;
      } catch (err) {
        // If token is invalid, we can still track anonymous analytics
        proposalId = req.params.id;
      }
    } else {
      proposalId = req.params.id;
    }

    // Validate required fields
    if (!pageNumber || !pageName || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Page number, page name, and session ID are required'
      });
    }

    // Insert analytics data
    await pool.query(
      `INSERT INTO proposal_views (
        proposal_id,
        page_number,
        page_name,
        session_id,
        time_spent_seconds,
        ip_address,
        user_agent,
        device_type,
        interactions_count,
        scrolled_to_bottom,
        viewed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        proposalId,
        pageNumber,
        pageName,
        sessionId,
        timeSpent || 0,
        req.ip,
        req.get('User-Agent'),
        deviceType || 'desktop',
        interactions || 0,
        scrolledToBottom || false
      ]
    );

    res.json({
      success: true,
      message: 'Analytics tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking analytics:', error);
    // Don't fail the request for analytics errors
    res.json({
      success: true,
      message: 'Analytics tracking completed'
    });
  }
});

// ============================================================================
// DASHBOARD STATS
// ============================================================================

// Get dashboard statistics
router.get('/dashboard/stats', authenticateUser, async (req, res) => {
  try {
    // Get proposal counts by status
    const statusStats = await pool.query(
      `SELECT
        status,
        COUNT(*) as count,
        SUM(proposal_value) as total_value
      FROM proposals
      WHERE user_id = $1
      GROUP BY status`,
      [req.user.userId]
    );

    // Get recent activity (last 30 days)
    const recentActivity = await pool.query(
      `SELECT
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_visitors
      FROM proposal_views pa
      INNER JOIN proposals p ON pa.proposal_id = p.id
      WHERE p.user_id = $1 AND pa.viewed_at >= NOW() - INTERVAL '30 days'`,
      [req.user.userId]
    );

    // Get monthly conversion rate
    const conversionStats = await pool.query(
      `SELECT
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
        COUNT(*) as total_count,
        ROUND(
          COUNT(CASE WHEN status = 'closed' THEN 1 END) * 100.0 /
          NULLIF(COUNT(*), 0), 2
        ) as conversion_rate
      FROM proposals
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
      [req.user.userId]
    );

    // Get recent comments
    const recentComments = await pool.query(
      `SELECT
        cc.comment_text,
        cc.created_at,
        p.proposal_name,
        p.client_name
      FROM client_comments cc
      INNER JOIN proposals p ON cc.proposal_id = p.id
      WHERE p.user_id = $1
      ORDER BY cc.created_at DESC
      LIMIT 5`,
      [req.user.userId]
    );

    const stats = {
      proposals: {
        total: statusStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
        open: statusStats.rows.find(row => row.status === 'open')?.count || 0,
        closed: statusStats.rows.find(row => row.status === 'closed')?.count || 0,
        archived: statusStats.rows.find(row => row.status === 'archived')?.count || 0
      },
      revenue: {
        total: statusStats.rows.reduce((sum, row) => sum + parseFloat(row.total_value || 0), 0),
        closed: statusStats.rows.find(row => row.status === 'closed')?.total_value || 0
      },
      activity: {
        views: parseInt(recentActivity.rows[0].views) || 0,
        uniqueVisitors: parseInt(recentActivity.rows[0].unique_visitors) || 0,
        conversionRate: parseFloat(conversionStats.rows[0].conversion_rate) || 0
      },
      recentComments: recentComments.rows
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Export router and initialization function
module.exports = {
  router,
  initializePool
};