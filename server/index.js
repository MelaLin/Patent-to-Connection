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

// Search patents endpoint (mock data for now)
app.get('/api/patents/search/serpapi', async (req, res) => {
  try {
    const { query, limit = '10', start_year, end_year, offset = '0' } = req.query;
    
    // Mock patent data - in a real app, this would call SerpAPI
    const mockPatents = [
      {
        patent_id: 'US1234567',
        title: 'Advanced Solar Panel Technology',
        abstract: 'A revolutionary solar panel design with improved efficiency and durability for renewable energy applications.',
        assignee: 'SolarTech Inc',
        inventors: [
          { name: 'Dr. Sarah Johnson', linkedin_url: 'https://linkedin.com/in/sarahjohnson' },
          { name: 'Michael Chen', linkedin_url: 'https://linkedin.com/in/michaelchen' }
        ],
        year: 2024,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US1234567',
        publication_date: '2024-06-15'
      },
      {
        patent_id: 'US2345678',
        title: 'Machine Learning Patent Analysis System',
        abstract: 'An AI-powered system for analyzing patent documents and extracting key insights for competitive intelligence.',
        assignee: 'TechCorp Inc',
        inventors: [
          { name: 'Dr. Alex Chen', linkedin_url: 'https://linkedin.com/in/alexchen' }
        ],
        year: 2024,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US2345678',
        publication_date: '2024-05-20'
      },
      {
        patent_id: 'US3456789',
        title: 'Quantum Computing Optimization Method',
        abstract: 'A novel approach to optimizing quantum computing algorithms for faster processing and improved accuracy.',
        assignee: 'Quantum Solutions Ltd',
        inventors: [
          { name: 'Dr. Emily Rodriguez', linkedin_url: 'https://linkedin.com/in/emilyrodriguez' },
          { name: 'David Kim', linkedin_url: 'https://linkedin.com/in/davidkim' }
        ],
        year: 2023,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US3456789',
        publication_date: '2023-12-10'
      },
      {
        patent_id: 'US4567890',
        title: 'Blockchain-Based Patent Registry',
        abstract: 'A decentralized system for registering and verifying patent ownership using blockchain technology.',
        assignee: 'Blockchain Innovations',
        inventors: [
          { name: 'Dr. James Wilson', linkedin_url: 'https://linkedin.com/in/jameswilson' }
        ],
        year: 2023,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US4567890',
        publication_date: '2023-11-05'
      },
      {
        patent_id: 'US5678901',
        title: 'Autonomous Vehicle Navigation System',
        abstract: 'An advanced navigation system for autonomous vehicles with real-time obstacle detection and path planning.',
        assignee: 'AutoDrive Technologies',
        inventors: [
          { name: 'Dr. Lisa Thompson', linkedin_url: 'https://linkedin.com/in/lisathompson' },
          { name: 'Robert Garcia', linkedin_url: 'https://linkedin.com/in/robertgarcia' }
        ],
        year: 2024,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US5678901',
        publication_date: '2024-04-12'
      },
      {
        patent_id: 'US6789012',
        title: 'Biometric Authentication Method',
        abstract: 'A secure biometric authentication system using multiple biometric factors for enhanced security.',
        assignee: 'SecureTech Solutions',
        inventors: [
          { name: 'Dr. Maria Santos', linkedin_url: 'https://linkedin.com/in/mariasantos' }
        ],
        year: 2024,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US6789012',
        publication_date: '2024-03-18'
      },
      {
        patent_id: 'US7890123',
        title: 'Smart Grid Energy Management',
        abstract: 'An intelligent energy management system for smart grids with real-time monitoring and optimization.',
        assignee: 'EnergyGrid Corp',
        inventors: [
          { name: 'Dr. Thomas Anderson', linkedin_url: 'https://linkedin.com/in/thomasanderson' },
          { name: 'Jennifer Lee', linkedin_url: 'https://linkedin.com/in/jenniferlee' }
        ],
        year: 2023,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US7890123',
        publication_date: '2023-10-25'
      },
      {
        patent_id: 'US8901234',
        title: '3D Printing Material Innovation',
        abstract: 'A new composite material for 3D printing with enhanced strength and flexibility properties.',
        assignee: 'PrintTech Industries',
        inventors: [
          { name: 'Dr. Kevin Park', linkedin_url: 'https://linkedin.com/in/kevinpark' }
        ],
        year: 2024,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US8901234',
        publication_date: '2024-02-14'
      },
      {
        patent_id: 'US9012345',
        title: 'Augmented Reality Display Technology',
        abstract: 'An advanced AR display system with improved field of view and reduced latency.',
        assignee: 'AR Vision Labs',
        inventors: [
          { name: 'Dr. Rachel Green', linkedin_url: 'https://linkedin.com/in/rachelgreen' },
          { name: 'Christopher Brown', linkedin_url: 'https://linkedin.com/in/christopherbrown' }
        ],
        year: 2024,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US9012345',
        publication_date: '2024-01-30'
      },
      {
        patent_id: 'US0123456',
        title: 'IoT Device Security Protocol',
        abstract: 'A comprehensive security protocol for IoT devices with encryption and authentication.',
        assignee: 'IoT Security Inc',
        inventors: [
          { name: 'Dr. Amanda White', linkedin_url: 'https://linkedin.com/in/amandawhite' }
        ],
        year: 2023,
        jurisdiction: 'US',
        google_patents_url: 'https://patents.google.com/patent/US0123456',
        publication_date: '2023-09-15'
      }
    ];

    // Filter by year range if provided
    let filteredPatents = mockPatents;
    if (start_year && end_year) {
      filteredPatents = mockPatents.filter(patent => 
        patent.year >= parseInt(start_year) && patent.year <= parseInt(end_year)
      );
    }

    // Apply offset and limit
    const startIndex = parseInt(offset);
    const limitedPatents = filteredPatents.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      results: limitedPatents,
      total: filteredPatents.length,
      query: query,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search patents' 
    });
  }
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
