// Client Authentication Routes
// Separate login system for clients accessing proposals

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const router = express.Router();
let pool; // Will be initialized by initializePool

// Rate limiting for client login
const clientLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },
});

// Initialize database pool
const initializePool = (dbPool) => {
  pool = dbPool;
};

// Client login endpoint
router.post('/login', clientLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário e senha são obrigatórios'
      });
    }

    // Find proposal by client username
    const proposalQuery = await pool.query(
      `SELECT id, client_username, client_password_hash, proposal_name, client_name, status
       FROM proposals
       WHERE client_username = $1`,
      [username]
    );

    if (proposalQuery.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    const proposal = proposalQuery.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, proposal.client_password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Generate client JWT token
    const token = jwt.sign(
      {
        proposalId: proposal.id,
        clientUsername: proposal.client_username,
        type: 'client'
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' } // Clients get longer sessions
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        proposalId: proposal.id,
        proposalName: proposal.proposal_name,
        clientName: proposal.client_name,
        status: proposal.status
      }
    });

  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Client authentication middleware
const authenticateClient = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err || decoded.type !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    req.client = decoded;
    next();
  });
};

// Get proposal data for client
router.get('/proposal/:id', authenticateClient, async (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);

    // Verify client can access this proposal
    if (req.client.proposalId !== proposalId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado a esta proposta'
      });
    }

    // Get proposal data
    const proposalQuery = await pool.query(
      `SELECT id, proposal_name, client_name, job_name,
              presentation_url, commercial_proposal_url,
              scope_text, terms_text, status, created_at
       FROM proposals
       WHERE id = $1`,
      [proposalId]
    );

    if (proposalQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposta não encontrada'
      });
    }

    const proposal = proposalQuery.rows[0];

    res.json({
      success: true,
      message: 'Proposta carregada com sucesso',
      data: {
        proposal
      }
    });

  } catch (error) {
    console.error('Error loading proposal for client:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Track page view
router.post('/proposal/:id/view', authenticateClient, async (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);
    const { page_name } = req.body;

    // Verify client can access this proposal
    if (req.client.proposalId !== proposalId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    // Get client IP
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create session ID for tracking unique sessions
    const sessionId = `${req.client.clientUsername}_${Date.now()}`;

    // Insert page view record
    await pool.query(
      `INSERT INTO proposal_views (proposal_id, page_name, viewed_at, ip_address, session_id)
       VALUES ($1, $2, NOW(), $3, $4)`,
      [proposalId, page_name, ipAddress, sessionId]
    );

    res.json({
      success: true,
      message: 'Visualização registrada'
    });

  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Save client comment
router.post('/proposal/:id/comment', authenticateClient, async (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);
    const { comment_text } = req.body;

    // Verify client can access this proposal
    if (req.client.proposalId !== proposalId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comentário não pode estar vazio'
      });
    }

    // Insert comment
    await pool.query(
      `INSERT INTO client_comments (proposal_id, comment_text, created_at)
       VALUES ($1, $2, NOW())`,
      [proposalId, comment_text.trim()]
    );

    res.json({
      success: true,
      message: 'Comentário salvo com sucesso'
    });

  } catch (error) {
    console.error('Error saving comment:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Accept proposal
router.post('/proposal/:id/accept', authenticateClient, async (req, res) => {
  try {
    const proposalId = parseInt(req.params.id);

    // Verify client can access this proposal
    if (req.client.proposalId !== proposalId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado'
      });
    }

    // Update proposal status to closed
    const updateResult = await pool.query(
      `UPDATE proposals
       SET status = 'closed', closed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'open'
       RETURNING id, proposal_name`,
      [proposalId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Proposta não pode ser aceita (já foi fechada ou não existe)'
      });
    }

    const proposal = updateResult.rows[0];

    res.json({
      success: true,
      message: 'Proposta aceita com sucesso! Negócio fechado.',
      data: {
        proposalId: proposal.id,
        proposalName: proposal.proposal_name,
        closedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error accepting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = { router, initializePool };