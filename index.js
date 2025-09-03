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

// Data file path
const WATCHLIST_FILE = path.join(__dirname, 'watchlist.json');

// SerpAPI configuration
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

// Thesis data structure
const THESES_FILE = path.join(__dirname, 'theses.json');

// Initialize watchlist.json if it doesn't exist
async function initializeWatchlistFile() {
  try {
    await fs.access(WATCHLIST_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty structure
    const initialData = {
      patents: [],
      queries: [],
      inventors: []
    };
    await fs.writeFile(WATCHLIST_FILE, JSON.stringify(initialData, null, 2));
    console.log('Created watchlist.json with initial structure');
  }
}

// Read watchlist data
async function readWatchlistData() {
  try {
    const data = await fs.readFile(WATCHLIST_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading watchlist data:', error);
    return { patents: [], queries: [], inventors: [] };
  }
}

// Write watchlist data
async function writeWatchlistData(data) {
  try {
    await fs.writeFile(WATCHLIST_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing watchlist data:', error);
    return false;
  }
}

// Initialize theses.json if it doesn't exist
async function initializeThesesFile() {
  try {
    await fs.access(THESES_FILE);
  } catch (error) {
    // File doesn't exist, create it with sample data
    const sampleTheses = [
      {
        id: generateUUID(),
        title: "Solar Energy Innovation",
        content: "We are looking for innovative solar energy technologies including photovoltaic panels, solar modules, energy storage systems, and renewable energy solutions. Focus areas include solar panel efficiency, building-integrated photovoltaics, solar tracking systems, and grid integration technologies.",
        starred: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        title: "AI in Healthcare",
        content: "Seeking artificial intelligence and machine learning applications in healthcare, including diagnostic tools, medical imaging, drug discovery, patient monitoring systems, and healthcare automation. Areas of interest include AI-powered medical devices, predictive analytics, and digital health platforms.",
        starred: false,
        created_at: new Date().toISOString()
      },
      {
        id: generateUUID(),
        title: "Hydrogen Supply Chain",
        content: "Investing in hydrogen production, storage, transportation, and distribution technologies. Looking for innovations in green hydrogen production, fuel cell technology, hydrogen storage solutions, and infrastructure development for hydrogen economy.",
        starred: false,
        created_at: new Date().toISOString()
      }
    ];
    
    await fs.writeFile(THESES_FILE, JSON.stringify(sampleTheses, null, 2));
    console.log('Created theses.json with sample data');
  }
}

// Read theses data
async function readThesesData() {
  try {
    const data = await fs.readFile(THESES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading theses data:', error);
    return [];
  }
}

// Write theses data
async function writeThesesData(data) {
  try {
    await fs.writeFile(THESES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing theses data:', error);
    return false;
  }
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Enhanced similarity scoring with better algorithm
function calculateSimilarity(text1, text2) {
  // Clean and normalize texts
  const cleanText1 = text1.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanText2 = text2.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Split into words and filter out common stop words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  const words1 = cleanText1.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  const words2 = cleanText2.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Create word frequency maps
  const freq1 = {};
  const freq2 = {};
  
  words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
  words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);
  
  // Calculate different similarity metrics
  
  // 1. Exact word overlap (Jaccard similarity)
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  
  // 2. Weighted word overlap (considering frequency)
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
  
  // 3. Keyword importance scoring
  const importantKeywords = ['solar', 'photovoltaic', 'panel', 'module', 'energy', 'power', 'electric', 'battery', 'storage', 'grid', 'renewable', 'clean', 'green', 'efficiency', 'system', 'device', 'method', 'apparatus', 'technology', 'innovation'];
  
  let keywordScore = 0;
  const thesisWords = new Set(words2);
  const patentWords = new Set(words1);
  
  importantKeywords.forEach(keyword => {
    if (thesisWords.has(keyword) && patentWords.has(keyword)) {
      keywordScore += 0.1; // High weight for matching important keywords
    }
  });
  
  // 4. Length similarity (shorter texts get slight boost)
  const lengthRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length);
  
  // Combine all metrics with weights
  const finalScore = (
    jaccardSimilarity * 0.3 +
    weightedSimilarity * 0.4 +
    keywordScore * 0.2 +
    lengthRatio * 0.1
  );
  
  // Apply score inflation to make results more meaningful
  // Use a sigmoid-like function to boost scores
  const inflatedScore = Math.min(1, finalScore * 3 + Math.pow(finalScore, 2));
  
  // Ensure minimum score for any match
  const minScore = finalScore > 0 ? 0.15 : 0;
  
  return Math.max(minScore, inflatedScore);
}

// API Routes

// Save Patent
app.post('/api/savePatent', async (req, res) => {
  try {
    const { title, abstract, assignee, inventors, link, date_filed } = req.body;
    
    if (!title || !abstract || !assignee) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, abstract, assignee' 
      });
    }

    const watchlistData = await readWatchlistData();
    
    const newPatent = {
      id: Date.now().toString(),
      title,
      abstract,
      assignee,
      inventors: inventors || [],
      link,
      date_filed,
      saved_at: new Date().toISOString(),
      user_id: 'dev' // For now, using a default user ID
    };

    watchlistData.patents.push(newPatent);
    
    const success = await writeWatchlistData(watchlistData);
    
    if (success) {
      res.json({ 
        success: true, 
        data: newPatent 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save patent' 
      });
    }
  } catch (error) {
    console.error('Error saving patent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Save Query
app.post('/api/saveQuery', async (req, res) => {
  try {
    const { query, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: query' 
      });
    }

    const watchlistData = await readWatchlistData();
    
    const newQuery = {
      id: Date.now().toString(),
      query,
      filters: filters || {},
      created_at: new Date().toISOString(),
      user_id: 'dev' // For now, using a default user ID
    };

    watchlistData.queries.push(newQuery);
    
    const success = await writeWatchlistData(watchlistData);
    
    if (success) {
      res.json({ 
        success: true, 
        data: newQuery 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save query' 
      });
    }
  } catch (error) {
    console.error('Error saving query:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Save Inventor
app.post('/api/saveInventor', async (req, res) => {
  try {
    const { name, linkedin_url, associated_patent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: name' 
      });
    }

    const watchlistData = await readWatchlistData();
    
    const newInventor = {
      id: Date.now().toString(),
      name,
      linkedin_url,
      associated_patent_id,
      created_at: new Date().toISOString(),
      user_id: 'dev' // For now, using a default user ID
    };

    watchlistData.inventors.push(newInventor);
    
    const success = await writeWatchlistData(watchlistData);
    
    if (success) {
      res.json({ 
        success: true, 
        data: newInventor 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save inventor' 
      });
    }
  } catch (error) {
    console.error('Error saving inventor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Alternative inventors save endpoint (for compatibility)
app.post('/api/inventors/save', async (req, res) => {
  try {
    const { name, affiliation, linkedin_url, associated_patent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: name' 
      });
    }

    const watchlistData = await readWatchlistData();
    
    const newInventor = {
      id: Date.now().toString(),
      name,
      affiliation,
      linkedin_url,
      associated_patent_id,
      created_at: new Date().toISOString(),
      user_id: 'dev' // For now, using a default user ID
    };

    watchlistData.inventors.push(newInventor);
    
    const success = await writeWatchlistData(watchlistData);
    
    if (success) {
      res.json({ 
        success: true, 
        inventorId: newInventor.id,
        data: newInventor 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save inventor' 
      });
    }
  } catch (error) {
    console.error('Error saving inventor:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Watchlist
app.get('/api/watchlist', async (req, res) => {
  try {
    const watchlistData = await readWatchlistData();
    
    // Filter by user_id (for now, return all data for 'dev' user)
    const userData = {
      patents: watchlistData.patents.filter(item => item.user_id === 'dev'),
      queries: watchlistData.queries.filter(item => item.user_id === 'dev'),
      inventors: watchlistData.inventors.filter(item => item.user_id === 'dev')
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch watchlist' 
    });
  }
});

// Watchlist save endpoints for compatibility
app.post('/api/watchlist/patents', async (req, res) => {
  try {
    const { title, abstract, assignee, inventors, link, date_filed } = req.body;
    
    if (!title || !abstract || !assignee) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, abstract, assignee' 
      });
    }

    const watchlistData = await readWatchlistData();
    
    const newPatent = {
      id: Date.now().toString(),
      title,
      abstract,
      assignee,
      inventors: inventors || [],
      link,
      date_filed,
      saved_at: new Date().toISOString(),
      user_id: 'dev' // For now, using a default user ID
    };

    watchlistData.patents.push(newPatent);
    
    const success = await writeWatchlistData(watchlistData);
    
    if (success) {
      res.json({ 
        success: true, 
        data: newPatent 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save patent' 
      });
    }
  } catch (error) {
    console.error('Error saving patent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

app.post('/api/watchlist/queries', async (req, res) => {
  try {
    const { query, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: query' 
      });
    }

    const watchlistData = await readWatchlistData();
    
    const newQuery = {
      id: Date.now().toString(),
      query,
      filters: filters || {},
      created_at: new Date().toISOString(),
      user_id: 'dev' // For now, using a default user ID
    };

    watchlistData.queries.push(newQuery);
    
    const success = await writeWatchlistData(watchlistData);
    
    if (success) {
      res.json({ 
        success: true, 
        data: newQuery 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save query' 
      });
    }
  } catch (error) {
    console.error('Error saving query:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    serpapi_key_exists: !!SERPAPI_KEY,
    serpapi_key_is_placeholder: SERPAPI_KEY === 'your_serpapi_key_here'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    serpapi_configured: !!(SERPAPI_KEY && SERPAPI_KEY !== 'your_serpapi_key_here'),
    serpapi_key_length: SERPAPI_KEY ? SERPAPI_KEY.length : 0,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to see raw SerpAPI response
app.get('/api/debug/serpapi-raw', async (req, res) => {
  try {
    const { query = 'smartphone' } = req.query;
    
    if (!SERPAPI_KEY || SERPAPI_KEY === 'your_serpapi_key_here') {
      return res.json({
        error: 'SerpAPI key not configured',
        note: 'This endpoint requires a real SerpAPI key'
      });
    }

    const serpApiParams = {
      api_key: SERPAPI_KEY,
      engine: 'google_patents',
      q: query,
      num: 10
    };

    console.log('Debug: Calling SerpAPI with params:', { ...serpApiParams, api_key: '[HIDDEN]' });

    const serpResponse = await axios.get(SERPAPI_BASE_URL, { params: serpApiParams });
    
    res.json({
      success: true,
      query: query,
      serpapi_response: serpResponse.data,
      response_keys: Object.keys(serpResponse.data || {}),
      has_patents_results: !!(serpResponse.data && serpResponse.data.patents_results),
      patents_results_length: serpResponse.data?.patents_results?.length || 0
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
});

// Debug endpoint for SerpAPI configuration
app.get('/api/debug/serpapi', (req, res) => {
  res.json({
    serpapi_key_exists: !!SERPAPI_KEY,
    serpapi_key_is_placeholder: SERPAPI_KEY === 'your_serpapi_key_here',
    serpapi_key_length: SERPAPI_KEY ? SERPAPI_KEY.length : 0,
    serpapi_key_preview: SERPAPI_KEY ? `${SERPAPI_KEY.substring(0, 4)}...${SERPAPI_KEY.substring(SERPAPI_KEY.length - 4)}` : 'none',
    environment_variables: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      SERPAPI_KEY_SET: !!process.env.SERPAPI_KEY
    }
  });
});

// Search patents endpoint using real SerpAPI
app.get('/api/patents/search/serpapi', async (req, res) => {
  try {
    const { query, limit = '10', start_year, end_year, offset = '0', jurisdiction } = req.query;
    
    // Check if there's a starred thesis for alignment scoring
    const theses = await readThesesData();
    const starredThesis = theses.find(thesis => thesis.starred);
    
    if (!SERPAPI_KEY || SERPAPI_KEY === 'your_serpapi_key_here') {
      // Provide realistic fallback data for testing
      console.log('SerpAPI key not configured, using fallback data for testing');
      
      const fallbackPatents = [
        {
          patent_id: 'US10123456B2',
          title: 'Hydroponic Growing System with Automated Nutrient Delivery',
          abstract: 'A hydroponic growing system that includes an automated nutrient delivery system for optimal plant growth in controlled environments.',
          assignee: 'GreenTech Solutions Inc',
          inventors: [
            { name: 'Dr. Sarah Johnson' },
            { name: 'Michael Chen' }
          ],
          year: 2023,
          jurisdiction: 'US',
          google_patents_url: 'https://patents.google.com/patent/US10123456B2',
          publication_date: '2023-06-15'
        },
        {
          patent_id: 'US9876543A1',
          title: 'Vertical Hydroponic Farming Apparatus',
          abstract: 'An apparatus for vertical hydroponic farming that maximizes space utilization while maintaining optimal growing conditions.',
          assignee: 'Urban Farm Technologies',
          inventors: [
            { name: 'Dr. Alex Rodriguez' }
          ],
          year: 2022,
          jurisdiction: 'US',
          google_patents_url: 'https://patents.google.com/patent/US9876543A1',
          publication_date: '2022-11-20'
        },
        {
          patent_id: 'US8765432B1',
          title: 'Smart Hydroponic Monitoring System',
          abstract: 'A monitoring system for hydroponic environments that tracks pH, temperature, and nutrient levels for automated adjustments.',
          assignee: 'SmartGrow Systems',
          inventors: [
            { name: 'Dr. Emily Davis' },
            { name: 'Robert Wilson' }
          ],
          year: 2024,
          jurisdiction: 'US',
          google_patents_url: 'https://patents.google.com/patent/US8765432B1',
          publication_date: '2024-03-10'
        }
      ];

      // Add alignment scores if there's a starred thesis
      let patentsWithAlignment = fallbackPatents;
      if (starredThesis) {
        patentsWithAlignment = fallbackPatents.map(patent => ({
          ...patent,
          alignment_score: calculateSimilarity(patent.abstract, starredThesis.content)
        }));
      }

      // Filter by year range if provided
      let filteredPatents = patentsWithAlignment;
      if (start_year && end_year) {
        filteredPatents = filteredPatents.filter(patent => 
          patent.year >= parseInt(start_year) && patent.year <= parseInt(end_year)
        );
      }

      // Filter by jurisdiction if provided
      if (jurisdiction && jurisdiction !== 'any') {
        filteredPatents = filteredPatents.filter(patent => 
          patent.jurisdiction === jurisdiction
        );
      }

      // Apply offset and limit
      const startIndex = parseInt(offset);
      const limitedPatents = filteredPatents.slice(startIndex, startIndex + parseInt(limit));

      return res.json({
        results: limitedPatents,
        total: filteredPatents.length,
        query: query,
        limit: parseInt(limit),
        hasMore: startIndex + parseInt(limit) < filteredPatents.length,
        starred_thesis: starredThesis ? { id: starredThesis.id, title: starredThesis.title } : null,
        message: 'Using fallback data - set SERPAPI_KEY for real results'
      });
    }

    // Build SerpAPI parameters - fetch more results upfront for better pagination
    const serpApiParams = {
      api_key: SERPAPI_KEY,
      engine: 'google_patents',
      q: query,
      num: 100, // Always fetch 100 results to handle pagination properly
      start: 1 // Always start from the beginning
    };

    // Add date filters if provided
    if (start_year && end_year) {
      serpApiParams.as_ylo = start_year;
      serpApiParams.as_yhi = end_year;
    }

    console.log('Calling SerpAPI with params:', { ...serpApiParams, api_key: '[HIDDEN]' });
    console.log('Jurisdiction filter:', jurisdiction);

    // Call SerpAPI
    const serpResponse = await axios.get(SERPAPI_BASE_URL, { params: serpApiParams });
    
    console.log('SerpAPI response keys:', Object.keys(serpResponse.data || {}));
    console.log('SerpAPI has organic_results:', !!(serpResponse.data && serpResponse.data.organic_results));
    console.log('SerpAPI organic_results length:', serpResponse.data?.organic_results?.length || 0);
    
    if (!serpResponse.data || !serpResponse.data.organic_results) {
      console.log('SerpAPI response:', serpResponse.data);
      return res.json({
        results: [],
        total: 0,
        query: query,
        limit: parseInt(limit),
        message: 'No patents found'
      });
    }

    // Transform SerpAPI response to our format - no filtering, just relevance and recency
    const patents = serpResponse.data.organic_results.map(patent => {
      // Extract patent ID from the patent_id field (e.g., "patent/US11622404B2/en")
      let patentId = patent.patent_id;
      
      // Clean up the patent ID by removing "patent/" prefix and "/en" suffix
      if (patentId && patentId.startsWith('patent/')) {
        patentId = patentId.replace('patent/', '').replace('/en', '');
      }
      
      // If no patent_id, try to extract from the link
      if (!patentId && patent.patent_link) {
        const match = patent.patent_link.match(/\/patent\/([^\/]+)/);
        patentId = match ? match[1] : null;
      }

      // Parse inventors from the inventor field
      let inventors = [];
      if (patent.inventor) {
        // Split by common separators and clean up
        const inventorNames = patent.inventor
          .split(/[,;]/)
          .map(name => name.trim())
          .filter(name => name.length > 0);
        
        inventors = inventorNames.map(name => ({ name }));
      }

      // Extract year from publication date
      let year = null;
      if (patent.publication_date) {
        const date = new Date(patent.publication_date);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear();
        }
      }

      // Determine jurisdiction from patent number
      let jurisdiction = 'US';
      if (patentId) {
        if (patentId.startsWith('EP')) jurisdiction = 'EP';
        else if (patentId.startsWith('WO')) jurisdiction = 'WO';
        else if (patentId.startsWith('JP')) jurisdiction = 'JP';
        else if (patentId.startsWith('CN')) jurisdiction = 'CN';
        else if (patentId.startsWith('US')) jurisdiction = 'US';
        else if (patentId.startsWith('MX')) jurisdiction = 'MX';
        else if (patentId.startsWith('IL')) jurisdiction = 'IL';
        else if (patentId.startsWith('GB')) jurisdiction = 'GB';
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

    // Add alignment scores if there's a starred thesis
    let patentsWithAlignment = patents;
    if (starredThesis) {
      patentsWithAlignment = patents.map(patent => ({
        ...patent,
        alignment_score: calculateSimilarity(patent.abstract, starredThesis.content)
      }));
    }

    // No filtering - return patents as-is, already sorted by relevance and recency
    const filteredPatents = patentsWithAlignment;

    // Apply offset and limit for proper pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const limitedPatents = filteredPatents.slice(startIndex, endIndex);
    
    console.log(`Pagination: ${filteredPatents.length} total patents, showing ${startIndex}-${endIndex}, got ${limitedPatents.length} patents`);

    return res.json({
      results: limitedPatents,
      total: filteredPatents.length,
      query: query,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: endIndex < filteredPatents.length,
      starred_thesis: starredThesis ? { id: starredThesis.id, title: starredThesis.title } : null,
      serpapi_info: {
        total_results: serpResponse.data.search_information?.total_results,
        time_taken: serpResponse.data.search_information?.time_taken_displayed
      }
    });
  } catch (error) {
    console.error('SerpAPI search error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // If it's a SerpAPI error, return a helpful message
    if (error.response?.data?.error) {
      return res.status(400).json({
        success: false,
        error: `SerpAPI Error: ${error.response.data.error}`,
        details: error.response.data,
        status: error.response.status
      });
    }
    
    // If it's a network error
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(500).json({
        success: false,
        error: 'Network error connecting to SerpAPI',
        details: error.message,
        code: error.code
      });
    }
    
    // If it's an authentication error
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'SerpAPI authentication failed - check your API key',
        details: error.response.data
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Search failed: ' + error.message,
      details: {
        message: error.message,
        status: error.response?.status,
        code: error.code
      }
    });
  }
});

// Delete endpoints for watchlist items
app.delete('/api/watchlist/patents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete patent with ID: ${id}`);
    
    const watchlist = await readWatchlistData();
    console.log(`Current watchlist has ${watchlist.patents.length} patents`);
    
    const patentIndex = watchlist.patents.findIndex(patent => patent.id === id);
    console.log(`Patent index: ${patentIndex}`);
    
    if (patentIndex === -1) {
      console.log(`Patent with ID ${id} not found`);
      return res.status(404).json({ success: false, error: 'Patent not found' });
    }
    
    watchlist.patents.splice(patentIndex, 1);
    console.log(`Patent removed, now have ${watchlist.patents.length} patents`);
    
    const writeResult = await writeWatchlistData(watchlist);
    console.log(`Write result: ${writeResult}`);
    
    if (writeResult) {
      res.json({ success: true, message: 'Patent deleted successfully' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to write watchlist data' });
    }
  } catch (error) {
    console.error('Error deleting patent:', error);
    res.status(500).json({ success: false, error: 'Failed to delete patent', details: error.message });
  }
});

app.delete('/api/watchlist/queries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const watchlist = await readWatchlistData();
    
    const queryIndex = watchlist.queries.findIndex(query => query.id === id);
    if (queryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }
    
    watchlist.queries.splice(queryIndex, 1);
    await writeWatchlistData(watchlist);
    
    res.json({ success: true, message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({ success: false, error: 'Failed to delete query' });
  }
});

app.delete('/api/watchlist/inventors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const watchlist = await readWatchlistData();
    
    const inventorIndex = watchlist.inventors.findIndex(inventor => inventor.id === id);
    if (inventorIndex === -1) {
      return res.status(404).json({ success: false, error: 'Inventor not found' });
    }
    
    watchlist.inventors.splice(inventorIndex, 1);
    await writeWatchlistData(watchlist);
    
    res.json({ success: true, message: 'Inventor deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventor:', error);
    res.status(500).json({ success: false, error: 'Failed to delete inventor' });
  }
});

// Clear watchlist endpoint
app.post('/api/watchlist/clear', async (req, res) => {
  try {
    const emptyWatchlist = {
      patents: [],
      queries: [],
      inventors: []
    };
    
    await writeWatchlistData(emptyWatchlist);
    
    console.log('Watchlist cleared successfully');
    
    return res.json({
      success: true,
      message: 'Watchlist cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing watchlist:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear watchlist'
    });
  }
});

// Test file operations
app.get('/api/test-file-ops', async (req, res) => {
  try {
    console.log('Testing file operations...');
    console.log('WATCHLIST_FILE path:', WATCHLIST_FILE);
    
    // Test reading
    const readResult = await readWatchlistData();
    console.log('Read result:', readResult);
    
    // Test writing
    const testData = { ...readResult, test: new Date().toISOString() };
    const writeResult = await writeWatchlistData(testData);
    console.log('Write result:', writeResult);
    
    // Test reading again
    const readResult2 = await readWatchlistData();
    console.log('Read result 2:', readResult2);
    
    res.json({
      success: true,
      readResult: readResult,
      writeResult: writeResult,
      readResult2: readResult2,
      filePath: WATCHLIST_FILE
    });
  } catch (error) {
    console.error('File operation test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Thesis API Endpoints

// GET /api/theses - List all theses
app.get('/api/theses', async (req, res) => {
  try {
    const theses = await readThesesData();
    res.json(theses);
  } catch (error) {
    console.error('Error fetching theses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch theses' });
  }
});

// POST /api/theses - Add new thesis
app.post('/api/theses', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, content' 
      });
    }

    const theses = await readThesesData();
    
    const newThesis = {
      id: generateUUID(),
      title: title.trim(),
      content: content.trim(),
      starred: false,
      created_at: new Date().toISOString()
    };

    theses.push(newThesis);
    
    const success = await writeThesesData(theses);
    
    if (success) {
      res.json({ 
        success: true, 
        data: newThesis 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save thesis' 
      });
    }
  } catch (error) {
    console.error('Error creating thesis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create thesis' 
    });
  }
});

// PUT /api/theses/:id - Update thesis
app.put('/api/theses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, content' 
      });
    }

    const theses = await readThesesData();
    const thesisIndex = theses.findIndex(thesis => thesis.id === id);
    
    if (thesisIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Thesis not found' 
      });
    }

    theses[thesisIndex] = {
      ...theses[thesisIndex],
      title: title.trim(),
      content: content.trim()
    };
    
    const success = await writeThesesData(theses);
    
    if (success) {
      res.json({ 
        success: true, 
        data: theses[thesisIndex] 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update thesis' 
      });
    }
  } catch (error) {
    console.error('Error updating thesis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update thesis' 
    });
  }
});

// DELETE /api/theses/:id - Delete thesis
app.delete('/api/theses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const theses = await readThesesData();
    
    const thesisIndex = theses.findIndex(thesis => thesis.id === id);
    if (thesisIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Thesis not found' 
      });
    }
    
    theses.splice(thesisIndex, 1);
    await writeThesesData(theses);
    
    res.json({ success: true, message: 'Thesis deleted successfully' });
  } catch (error) {
    console.error('Error deleting thesis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete thesis' 
    });
  }
});

// POST /api/theses/:id/star - Star thesis (unstar others)
app.post('/api/theses/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    const theses = await readThesesData();
    
    const thesisIndex = theses.findIndex(thesis => thesis.id === id);
    if (thesisIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Thesis not found' 
      });
    }
    
    // Unstar all theses first
    theses.forEach(thesis => {
      thesis.starred = false;
    });
    
    // Star the selected thesis
    theses[thesisIndex].starred = true;
    
    await writeThesesData(theses);
    
    res.json({ 
      success: true, 
      data: theses[thesisIndex],
      message: 'Thesis starred successfully' 
    });
  } catch (error) {
    console.error('Error starring thesis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to star thesis' 
    });
  }
});

// GET /api/theses/starred - Get starred thesis
app.get('/api/theses/starred', async (req, res) => {
  try {
    const theses = await readThesesData();
    const starredThesis = theses.find(thesis => thesis.starred);
    
    res.json({ 
      success: true, 
      data: starredThesis || null 
    });
  } catch (error) {
    console.error('Error fetching starred thesis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch starred thesis' 
    });
  }
});

// Initialize the watchlist file on startup
initializeWatchlistFile().then(() => {
  return initializeThesesFile();
}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Watchlist file: ${WATCHLIST_FILE}`);
    console.log(`Theses file: ${THESES_FILE}`);
  });
}).catch(error => {
  console.error('Failed to initialize files:', error);
  process.exit(1);
});
