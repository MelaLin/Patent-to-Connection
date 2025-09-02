const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const WATCHLIST_FILE = path.join(__dirname, 'watchlist.json');

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize the watchlist file on startup
initializeWatchlistFile().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Watchlist file: ${WATCHLIST_FILE}`);
  });
}).catch(error => {
  console.error('Failed to initialize watchlist file:', error);
  process.exit(1);
});
