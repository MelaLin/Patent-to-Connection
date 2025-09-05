const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { initializeDatabase } = require('./database');
const dbService = require('./databaseServiceRest');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8080', 
      'http://localhost:3000', 
      'https://patentforge-pcxichiix-melalins-projects.vercel.app', 
      'https://patentforge-4hyf4ouu8-melalins-projects.vercel.app', 
      'https://patentforge-sigma.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email', 'email', 'Origin', 'Accept']
}));

// Add CORS debugging middleware
app.use((req, res, next) => {
  console.log('CORS Debug: Request origin:', req.headers.origin);
  console.log('CORS Debug: Request method:', req.method);
  console.log('CORS Debug: Request headers:', req.headers);
  next();
});
app.use(express.json());

// Multi-tenant data structure
const USERS_FILE = path.join(__dirname, 'users.json');
const USER_DATA_DIR = path.join(__dirname, 'user_data');

// SerpAPI configuration - use environment variables for security
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

// Get SerpAPI key from environment variable
function getUserSerpAPIKey(userEmail) {
  // Map user emails to environment variable names
  const keyMapping = {
    'melalin@stanford.edu': process.env.SERPAPI_KEY_MELA1,
    'melalin05@gmail.com': process.env.SERPAPI_KEY_MELATEST,
    'michael@factore.com': process.env.SERPAPI_KEY_MICHAEL,
    // Add more users as needed
  };
  
  console.log(`Getting SerpAPI key for ${userEmail}: ${keyMapping[userEmail] ? 'Key found' : 'Key missing'}`);
  return keyMapping[userEmail] || process.env.SERPAPI_KEY_DEFAULT;
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Enhanced similarity scoring
function calculateSimilarity(text1, text2) {
  const cleanText1 = text1.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanText2 = text2.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  const words1 = cleanText1.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  const words2 = cleanText2.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const freq1 = {};
  const freq2 = {};
  
  words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
  words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  
  let weightedOverlap = 0;
  let totalWeight = 0;
  
  Object.keys(freq1).forEach(word => {
    if (freq2[word]) {
      const weight = Math.min(freq1[word], freq2[word]);
      weightedOverlap += weight;
    }
    totalWeight += freq1[word];
  });
  
  const weightedSimilarity = totalWeight > 0 ? weightedOverlap / totalWeight : 0;
  
  const importantKeywords = ['solar', 'photovoltaic', 'panel', 'module', 'energy', 'power', 'electric', 'battery', 'storage', 'grid', 'renewable', 'clean', 'green', 'efficiency', 'system', 'device', 'method', 'apparatus', 'technology', 'innovation'];
  
  let keywordScore = 0;
  const thesisWords = new Set(words2);
  const patentWords = new Set(words1);
  
  importantKeywords.forEach(keyword => {
    if (thesisWords.has(keyword) && patentWords.has(keyword)) {
      keywordScore += 0.1;
    }
  });
  
  const lengthRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length);
  
  const finalScore = (
    jaccardSimilarity * 0.3 +
    weightedSimilarity * 0.4 +
    keywordScore * 0.2 +
    lengthRatio * 0.1
  );
  
  const inflatedScore = Math.min(1, finalScore * 3 + Math.pow(finalScore, 2));
  const minScore = finalScore > 0 ? 0.15 : 0;
  
  return Math.max(minScore, inflatedScore);
}

// Initialize user management
async function initializeUserSystem() {
  try {
    await fs.mkdir(USER_DATA_DIR, { recursive: true });
    
    // Check if users.json exists and has the correct users
    try {
      await fs.access(USERS_FILE);
      const existingUsers = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
      
      // Check if the current users are in the file
      const currentUsers = ['melalin@stanford.edu', 'melalin05@gmail.com'];
      const hasCurrentUsers = currentUsers.every(email => 
        existingUsers.some(user => user.email === email)
      );
      
      if (!hasCurrentUsers) {
        console.log('Updating users.json with current user list');
        const updatedUsers = [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            email: "melalin@stanford.edu",
            name: "Mela Lin 1",
            created_at: "2024-01-15T10:30:00.000Z",
            is_active: true
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            email: "melalin05@gmail.com",
            name: "Mela Lin TEST",
            created_at: "2024-01-15T10:30:00.000Z",
            is_active: true
          }
        ];
        
        await fs.writeFile(USERS_FILE, JSON.stringify(updatedUsers, null, 2));
        console.log('users.json updated with current users');
      } else {
        console.log('users.json already has current users, skipping update');
      }
    } catch (error) {
      // File doesn't exist, create it with current user data
      console.log('Creating users.json with current user data');
      const currentUsers = [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "melalin@stanford.edu",
          name: "Mela Lin 1",
          created_at: "2024-01-15T10:30:00.000Z",
          is_active: true
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          email: "melalin05@gmail.com",
          name: "Mela Lin 2",
          created_at: "2024-01-15T10:30:00.000Z",
          is_active: true
        }
      ];
      
      await fs.writeFile(USERS_FILE, JSON.stringify(currentUsers, null, 2));
      console.log('Multi-tenant system initialized with current user data');
    }
  } catch (error) {
    console.error('Error initializing user system:', error);
  }
}

// User management functions
async function getUserByEmail(email) {
  const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
  return users.find(user => user.email === email);
}

// Enhanced data persistence with backup and recovery
async function getUserData(userId) {
  const userDataFile = path.join(USER_DATA_DIR, `${userId}.json`);
  const backupFile = path.join(USER_DATA_DIR, `${userId}.backup.json`);
  
  try {
    // Try to read the main file first
    const data = await fs.readFile(userDataFile, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Validate the data structure
    if (!parsedData.patents || !parsedData.queries || !parsedData.inventors || !parsedData.theses) {
      console.log(`Invalid data structure for user ${userId}, using backup or default`);
      throw new Error('Invalid data structure');
    }
    
    console.log(`Successfully loaded data for user ${userId}: ${parsedData.patents.length} patents, ${parsedData.queries.length} queries, ${parsedData.inventors.length} inventors, ${parsedData.theses.length} theses`);
    return parsedData;
  } catch (error) {
    console.log(`Failed to read main data file for user ${userId}:`, error.message);
    
    // Try to read from backup
    try {
      const backupData = await fs.readFile(backupFile, 'utf8');
      const parsedBackup = JSON.parse(backupData);
      
      if (parsedBackup.patents && parsedBackup.queries && parsedBackup.inventors && parsedBackup.theses) {
        console.log(`Restored data from backup for user ${userId}`);
        // Restore the main file from backup
        await saveUserData(userId, parsedBackup);
        return parsedBackup;
      }
    } catch (backupError) {
      console.log(`Backup file also failed for user ${userId}:`, backupError.message);
    }
    
    // Return default structure if both files fail
    console.log(`Using default data structure for user ${userId}`);
    return {
      patents: [],
      queries: [],
      inventors: [],
      theses: []
    };
  }
}

async function saveUserData(userId, data) {
  const userDataFile = path.join(USER_DATA_DIR, `${userId}.json`);
  const backupFile = path.join(USER_DATA_DIR, `${userId}.backup.json`);
  
  try {
    // Ensure the user_data directory exists
    await fs.mkdir(USER_DATA_DIR, { recursive: true });
    
    // Validate data structure before saving
    if (!data.patents || !data.queries || !data.inventors || !data.theses) {
      console.error(`Invalid data structure for user ${userId}, cannot save`);
      throw new Error('Invalid data structure');
    }
    
    // Create backup first
    const backupData = JSON.stringify(data, null, 2);
    await fs.writeFile(backupFile, backupData);
    
    // Then save to main file
    const mainData = JSON.stringify(data, null, 2);
    await fs.writeFile(userDataFile, mainData);
    
    console.log(`Successfully saved data for user ${userId}: ${data.patents.length} patents, ${data.queries.length} queries, ${data.inventors.length} inventors, ${data.theses.length} theses`);
  } catch (error) {
    console.error(`Failed to save data for user ${userId}:`, error.message);
    throw error;
  }
}

// Authentication middleware
async function authenticateUser(req, res, next) {
  try {
    // Try both header formats for maximum compatibility
    let email = req.headers['x-user-email'] || req.headers['X-User-Email'] || req.headers.email;
    
    console.log('Backend: authenticateUser called with email header:', email);
    
    if (!email) {
      console.log('Backend: No email header found, returning 401');
      return res.status(401).json({ error: 'Email required' });
    }
    
    // Get or create user in Supabase
    const user = await dbService.getOrCreateUser(email, email.split('@')[0]);
    
    console.log('Backend: User authenticated successfully:', user.email);
    req.user = user;
    req.userEmail = email;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// API Routes with user isolation
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  });
});

app.get('/api/watchlist', authenticateUser, async (req, res) => {
  try {
    const watchlistData = await dbService.getWatchlistData(req.user.id);
    res.json(watchlistData);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

app.post('/api/watchlist/patents', authenticateUser, async (req, res) => {
  try {
    const patentData = {
      patent_id: req.body.patent_id || req.body.id || Date.now().toString(),
      title: req.body.title,
      abstract: req.body.abstract,
      assignee: req.body.assignee,
      inventors: req.body.inventors || [],
      link: req.body.link,
      date_filed: req.body.date_filed
    };
    
    const patent = await dbService.createPatent(req.user.id, patentData);
    await dbService.addToWatchlist(req.user.id, 'patent', patentData.patent_id, patentData);
    
    res.json({ success: true, data: patent });
  } catch (error) {
    console.error('Error saving patent:', error);
    res.status(500).json({ error: 'Failed to save patent' });
  }
});

app.post('/api/watchlist/queries', authenticateUser, async (req, res) => {
  try {
    const query = req.body.query || req.body.text;
    await dbService.addToWatchlist(req.user.id, 'query', query, req.body);
    
    res.json({ success: true, data: { query, id: Date.now().toString() } });
  } catch (error) {
    console.error('Error saving query:', error);
    res.status(500).json({ error: 'Failed to save query' });
  }
});

app.post('/api/watchlist/inventors', authenticateUser, async (req, res) => {
  try {
    const inventorName = req.body.name || req.body.inventor;
    const inventorData = {
      linkedin_url: req.body.linkedin_url,
      associated_patent_id: req.body.associated_patent_id
    };
    
    await dbService.addToWatchlist(req.user.id, 'inventor', inventorName, inventorData);
    
    res.json({ success: true, data: { name: inventorName, id: Date.now().toString() } });
  } catch (error) {
    console.error('Error saving inventor:', error);
    res.status(500).json({ error: 'Failed to save inventor' });
  }
});

// Thesis management
app.get('/api/theses', authenticateUser, async (req, res) => {
  try {
    const theses = await dbService.getTheses(req.user.id);
    res.json(theses);
  } catch (error) {
    console.error('Error fetching theses:', error);
    res.status(500).json({ error: 'Failed to fetch theses' });
  }
});

app.post('/api/theses', authenticateUser, async (req, res) => {
  try {
    const { title, content } = req.body;
    const thesis = await dbService.createThesis(req.user.id, title, content);
    res.json({ success: true, data: thesis });
  } catch (error) {
    console.error('Error creating thesis:', error);
    res.status(500).json({ error: 'Failed to create thesis' });
  }
});

app.post('/api/theses/:id/star', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First unstar all theses
    const allTheses = await dbService.getTheses(req.user.id);
    for (const thesis of allTheses) {
      await dbService.updateThesisStarred(req.user.id, thesis.id, false);
    }
    
    // Then star the selected thesis
    const starredThesis = await dbService.updateThesisStarred(req.user.id, id, true);
    
    res.json({ success: true, data: starredThesis });
  } catch (error) {
    console.error('Error starring thesis:', error);
    res.status(500).json({ error: 'Failed to star thesis' });
  }
});

app.get('/api/theses/starred', authenticateUser, async (req, res) => {
  try {
    const starredThesis = await dbService.getStarredThesis(req.user.id);
    res.json({ success: true, data: starredThesis });
  } catch (error) {
    console.error('Error fetching starred thesis:', error);
    res.status(500).json({ error: 'Failed to fetch starred thesis' });
  }
});


// Search with user's SerpAPI key
app.get('/api/patents/search/serpapi', authenticateUser, async (req, res) => {
  try {
    const { query, limit = '10', offset = '0' } = req.query;
    const userSerpAPIKey = getUserSerpAPIKey(req.user.email);
    
    if (!userSerpAPIKey || userSerpAPIKey === 'YOUR_SERPAPI_KEY_1') {
      // Provide fallback data for testing
      const fallbackPatents = [
        {
          patent_id: 'US10123456B2',
          title: 'Solar Panel System with Enhanced Efficiency',
          abstract: 'A solar panel system that includes advanced photovoltaic technology for improved energy conversion efficiency.',
          assignee: 'SolarTech Inc',
          inventors: [{ name: 'Dr. Sarah Johnson' }],
          year: 2023,
          jurisdiction: 'US',
          google_patents_url: 'https://patents.google.com/patent/US10123456B2',
          publication_date: '2023-06-15'
        }
      ];
      
      const userData = await getUserData(req.user.id);
      const starredThesis = userData.theses?.find(thesis => thesis.starred);
      
      let patentsWithAlignment = fallbackPatents;
      if (starredThesis) {
        patentsWithAlignment = fallbackPatents.map(patent => ({
          ...patent,
          alignment_score: calculateSimilarity(patent.abstract, starredThesis.content)
        }));
      }
      
      return res.json({
        results: patentsWithAlignment,
        total: patentsWithAlignment.length,
        query: query,
        limit: parseInt(limit),
        hasMore: false,
        starred_thesis: starredThesis ? { id: starredThesis.id, title: starredThesis.title } : null,
        message: 'Using fallback data - configure SerpAPI key for real results'
      });
    }
    
    // Real SerpAPI call with user's key
    const serpApiParams = {
      api_key: userSerpAPIKey,
      engine: 'google_patents',
      q: query,
      num: 100,
      start: 1,
      sort_by: 'date'
    };
    
    const serpResponse = await axios.get(SERPAPI_BASE_URL, { params: serpApiParams });
    
    if (!serpResponse.data.organic_results) {
      return res.json({
        results: [],
        total: 0,
        query: query,
        limit: parseInt(limit),
        hasMore: false,
        message: 'No patents found'
      });
    }
    
    const patents = serpResponse.data.organic_results.map(patent => {
      const patentId = patent.patent_number || patent.patent_id;
      
      // Extract inventors from various possible SerpAPI response formats
      let inventors = [];
      if (patent.inventors && Array.isArray(patent.inventors)) {
        inventors = patent.inventors.map(name => ({ name: name.trim() }));
      } else if (patent.inventor && typeof patent.inventor === 'string') {
        // Handle single inventor string
        inventors = [{ name: patent.inventor.trim() }];
      } else if (patent.inventor && Array.isArray(patent.inventor)) {
        inventors = patent.inventor.map(name => ({ name: name.trim() }));
      } else if (patent.people && Array.isArray(patent.people)) {
        // Some SerpAPI responses use 'people' field for inventors
        inventors = patent.people
          .filter(person => person.role === 'inventor' || person.type === 'inventor')
          .map(person => ({ name: person.name.trim() }));
      }
      
      // If still no inventors found, provide a fallback for user interaction
      if (inventors.length === 0) {
        // Generate a placeholder inventor based on the patent title or assignee
        const assignee = patent.assignee || 'Unknown Assignee';
        const title = patent.title || 'Untitled Patent';
        
        // Extract potential inventor from assignee (often contains inventor names)
        const assigneeWords = assignee.split(/\s+/).filter(word => word.length > 2);
        if (assigneeWords.length > 0) {
          // Use first two words of assignee as potential inventor
          const potentialInventor = assigneeWords.slice(0, 2).join(' ');
          inventors = [{ name: potentialInventor }];
        } else {
          // Fallback to a generic inventor name
          inventors = [{ name: 'Patent Inventor' }];
        }
      }
      
      let year = null;
      if (patent.publication_date) {
        const date = new Date(patent.publication_date);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear();
        }
      }
      
      let jurisdiction = 'US';
      if (patentId) {
        if (patentId.startsWith('EP')) jurisdiction = 'EP';
        else if (patentId.startsWith('WO')) jurisdiction = 'WO';
        else if (patentId.startsWith('JP')) jurisdiction = 'JP';
        else if (patentId.startsWith('CN')) jurisdiction = 'CN';
        else if (patentId.startsWith('US')) jurisdiction = 'US';
      }
      
      return {
        patent_id: patentId,
        title: patent.title || 'Untitled Patent',
        abstract: patent.snippet || patent.abstract || 'No abstract available',
        assignee: patent.assignee || 'Unknown Assignee',
        inventors: inventors,
        year: year,
        jurisdiction: jurisdiction,
        google_patents_url: patent.patent_link || (patentId ? `https://patents.google.com/patent/${patentId}` : null),
        publication_date: patent.publication_date,
        filing_date: patent.filing_date
      };
    });
    
    const userData = await getUserData(req.user.id);
    const starredThesis = userData.theses?.find(thesis => thesis.starred);
    
    let patentsWithAlignment = patents;
    if (starredThesis) {
      patentsWithAlignment = patents.map(patent => ({
        ...patent,
        alignment_score: calculateSimilarity(patent.abstract, starredThesis.content)
      }));
    }
    
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const limitedPatents = patentsWithAlignment.slice(startIndex, endIndex);
    
    return res.json({
      results: limitedPatents,
      total: patentsWithAlignment.length,
      query: query,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: endIndex < patentsWithAlignment.length,
      starred_thesis: starredThesis ? { id: starredThesis.id, title: starredThesis.title } : null,
      serpapi_info: {
        total_results: serpResponse.data.search_information?.total_results,
        time_taken: serpResponse.data.search_information?.time_taken_displayed
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed: ' + error.message 
    });
  }
});

// Delete endpoints
app.delete('/api/watchlist/patents/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteWatchlistItem(req.user.id, id);
    res.json({ success: true, message: 'Patent deleted successfully' });
  } catch (error) {
    console.error('Error deleting patent:', error);
    res.status(500).json({ error: 'Failed to delete patent' });
  }
});

app.delete('/api/watchlist/queries/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteWatchlistItem(req.user.id, id);
    res.json({ success: true, message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ error: 'Failed to delete query' });
  }
});

app.delete('/api/watchlist/inventors/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteWatchlistItem(req.user.id, id);
    res.json({ success: true, message: 'Inventor deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventor:', error);
    res.status(500).json({ error: 'Failed to delete inventor' });
  }
});

app.delete('/api/theses/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.deleteThesis(req.user.id, id);
    res.json({ success: true, message: 'Thesis deleted successfully' });
  } catch (error) {
    console.error('Error deleting thesis:', error);
    res.status(500).json({ error: 'Failed to delete thesis' });
  }
});


// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { pool } = require('./database');
    await pool.query('SELECT 1');
    
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      multi_tenant: true
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize and start server
initializeDatabase()
  .then(() => {
    return initializeUserSystem();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Users file: ${USERS_FILE}`);
      console.log(`User data directory: ${USER_DATA_DIR}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  });
