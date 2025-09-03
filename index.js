const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multi-tenant data structure
const USERS_FILE = path.join(__dirname, 'users.json');
const USER_DATA_DIR = path.join(__dirname, 'user_data');

// SerpAPI configuration
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

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
    
    // Initialize users.json with your team
    const teamUsers = [
      {
        id: generateUUID(),
        email: 'partner1@yourvc.com',
        name: 'Partner 1',
        serpapi_key: 'YOUR_SERPAPI_KEY_1',
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: generateUUID(),
        email: 'partner2@yourvc.com', 
        name: 'Partner 2',
        serpapi_key: 'YOUR_SERPAPI_KEY_2',
        created_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: generateUUID(),
        email: 'partner3@yourvc.com',
        name: 'Partner 3', 
        serpapi_key: 'YOUR_SERPAPI_KEY_3',
        created_at: new Date().toISOString(),
        is_active: true
      }
    ];
    
    await fs.writeFile(USERS_FILE, JSON.stringify(teamUsers, null, 2));
    console.log('Multi-tenant system initialized');
  } catch (error) {
    console.error('Error initializing user system:', error);
  }
}

// User management functions
async function getUserByEmail(email) {
  const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
  return users.find(user => user.email === email);
}

async function getUserData(userId) {
  const userDataFile = path.join(USER_DATA_DIR, `${userId}.json`);
  try {
    const data = await fs.readFile(userDataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
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
  await fs.writeFile(userDataFile, JSON.stringify(data, null, 2));
}

// Authentication middleware
async function authenticateUser(req, res, next) {
  const { email } = req.headers;
  
  if (!email) {
    return res.status(401).json({ error: 'Email required' });
  }
  
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = user;
  next();
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
  const userData = await getUserData(req.user.id);
  res.json(userData);
});

app.post('/api/watchlist/patents', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const newPatent = {
    ...req.body,
    id: generateUUID(),
    user_id: req.user.id,
    saved_at: new Date().toISOString()
  };
  
  userData.patents.push(newPatent);
  await saveUserData(req.user.id, userData);
  
  res.json({ success: true, data: newPatent });
});

app.post('/api/watchlist/queries', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const newQuery = {
    ...req.body,
    id: generateUUID(),
    user_id: req.user.id,
    created_at: new Date().toISOString()
  };
  
  userData.queries.push(newQuery);
  await saveUserData(req.user.id, userData);
  
  res.json({ success: true, data: newQuery });
});

app.post('/api/watchlist/inventors', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const newInventor = {
    ...req.body,
    id: generateUUID(),
    user_id: req.user.id,
    saved_at: new Date().toISOString()
  };
  
  userData.inventors.push(newInventor);
  await saveUserData(req.user.id, userData);
  
  res.json({ success: true, data: newInventor });
});

// Thesis management
app.get('/api/theses', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  res.json(userData.theses || []);
});

app.post('/api/theses', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const newThesis = {
    ...req.body,
    id: generateUUID(),
    user_id: req.user.id,
    starred: false,
    created_at: new Date().toISOString()
  };
  
  if (!userData.theses) userData.theses = [];
  userData.theses.push(newThesis);
  await saveUserData(req.user.id, userData);
  
  res.json({ success: true, data: newThesis });
});

app.post('/api/theses/:id/star', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const { id } = req.params;
  
  if (!userData.theses) userData.theses = [];
  
  // Unstar all theses first
  userData.theses.forEach(thesis => {
    thesis.starred = false;
  });
  
  // Star the selected thesis
  const thesisIndex = userData.theses.findIndex(thesis => thesis.id === id);
  if (thesisIndex !== -1) {
    userData.theses[thesisIndex].starred = true;
  }
  
  await saveUserData(req.user.id, userData);
  
  res.json({ success: true, data: userData.theses[thesisIndex] });
});

app.get('/api/theses/starred', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const starredThesis = userData.theses?.find(thesis => thesis.starred) || null;
  
  res.json({ success: true, data: starredThesis });
});

// Search with user's SerpAPI key
app.get('/api/patents/search/serpapi', authenticateUser, async (req, res) => {
  try {
    const { query, limit = '10', offset = '0' } = req.query;
    const userSerpAPIKey = req.user.serpapi_key;
    
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
      const inventorNames = patent.inventors || [];
      const inventors = inventorNames.map(name => ({ name: name.trim() }));
      
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
  const userData = await getUserData(req.user.id);
  const { id } = req.params;
  
  const patentIndex = userData.patents.findIndex(patent => patent.id === id);
  if (patentIndex !== -1) {
    userData.patents.splice(patentIndex, 1);
    await saveUserData(req.user.id, userData);
  }
  
  res.json({ success: true, message: 'Patent deleted successfully' });
});

app.delete('/api/watchlist/queries/:id', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const { id } = req.params;
  
  const queryIndex = userData.queries.findIndex(query => query.id === id);
  if (queryIndex !== -1) {
    userData.queries.splice(queryIndex, 1);
    await saveUserData(req.user.id, userData);
  }
  
  res.json({ success: true, message: 'Query deleted successfully' });
});

app.delete('/api/watchlist/inventors/:id', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const { id } = req.params;
  
  const inventorIndex = userData.inventors.findIndex(inventor => inventor.id === id);
  if (inventorIndex !== -1) {
    userData.inventors.splice(inventorIndex, 1);
    await saveUserData(req.user.id, userData);
  }
  
  res.json({ success: true, message: 'Inventor deleted successfully' });
});

app.delete('/api/theses/:id', authenticateUser, async (req, res) => {
  const userData = await getUserData(req.user.id);
  const { id } = req.params;
  
  if (!userData.theses) userData.theses = [];
  
  const thesisIndex = userData.theses.findIndex(thesis => thesis.id === id);
  if (thesisIndex !== -1) {
    userData.theses.splice(thesisIndex, 1);
    await saveUserData(req.user.id, userData);
  }
  
  res.json({ success: true, message: 'Thesis deleted successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    multi_tenant: true
  });
});

// Initialize and start server
initializeUserSystem().then(() => {
  app.listen(PORT, () => {
    console.log(`Multi-tenant server running on port ${PORT}`);
    console.log(`Users file: ${USERS_FILE}`);
    console.log(`User data directory: ${USER_DATA_DIR}`);
  });
}).catch(error => {
  console.error('Failed to initialize multi-tenant system:', error);
  process.exit(1);
});
