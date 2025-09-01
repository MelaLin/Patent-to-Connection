# Patent Forge Backend

A FastAPI-based backend for the Patent Forge application, providing patent search, watchlist management, and alert functionality.

## Features

- **Patent Management**: CRUD operations for patents with search capabilities
- **Watchlist**: User-specific patent watchlists with notes and status tracking
- **Alerts**: Notification system for patent status changes and deadlines
- **External API Integration**: SerpAPI and PatentsView API integration
- **Async Database**: SQLAlchemy 2.0 with asyncpg for PostgreSQL
- **Comprehensive Testing**: pytest-based test suite with async support

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI applications
- **SQLAlchemy 2.0**: Modern ORM with async support
- **asyncpg**: Async PostgreSQL driver
- **Alembic**: Database migration tool
- **Pydantic**: Data validation and settings management
- **httpx**: Async HTTP client for external API calls
- **pytest**: Testing framework with async support

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Application settings
│   │   └── database.py        # Database configuration
│   ├── models/
│   │   ├── patent.py          # Patent model
│   │   ├── watchlist.py       # Watchlist model
│   │   └── alert.py           # Alert model
│   ├── schemas/
│   │   ├── patent.py          # Patent Pydantic schemas
│   │   ├── watchlist.py       # Watchlist Pydantic schemas
│   │   └── alert.py           # Alert Pydantic schemas
│   ├── services/
│   │   ├── serpapi.py         # SerpAPI integration
│   │   ├── patentsview.py     # PatentsView API integration
│   │   ├── linkedin.py        # LinkedIn integration
│   │   └── trends.py          # Patent trends analysis
│   ├── routers/
│   │   ├── patents.py         # Patent endpoints
│   │   ├── watchlist.py       # Watchlist endpoints
│   │   └── alerts.py          # Alert endpoints
│   └── main.py                # FastAPI application
├── alembic/                   # Database migrations
├── tests/                     # Test suite
├── requirements.txt           # Python dependencies
├── alembic.ini               # Alembic configuration
├── pytest.ini               # pytest configuration
├── run.py                    # Application entry point
└── env.example               # Environment variables template
```

## Installation

1. **Clone the repository**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

5. **Set up the database**:
   ```bash
   # Create PostgreSQL database
   createdb patent_forge
   
   # Run migrations
   alembic upgrade head
   ```

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SERPAPI_API_KEY`: SerpAPI API key for patent search
- `PATENTSVIEW_BASE`: USPTO PatentsView API base URL
- `ALLOWED_ORIGINS`: CORS allowed origins (JSON array)
- `DEBUG`: Enable debug mode

### Database Setup

1. **Install PostgreSQL** if not already installed
2. **Create database**:
   ```bash
   createdb patent_forge
   ```
3. **Run migrations**:
   ```bash
   alembic upgrade head
   ```

## Running the Application

### Development Server

```bash
python run.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, you can access:

- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### Patents (`/api/patents`)

- `GET /api/patents` - Get all patents with pagination
- `GET /api/patents/{patent_number}` - Get specific patent
- `POST /api/patents` - Create new patent
- `PUT /api/patents/{patent_number}` - Update patent
- `DELETE /api/patents/{patent_number}` - Delete patent
- `GET /api/patents/search/serpapi` - Search patents via SerpAPI
- `GET /api/patents/search/patentsview` - Search patents via PatentsView
- `GET /api/patents/{patent_number}/details` - Get detailed patent info

### Watchlist (`/api/watchlist`)

- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add patent to watchlist
- `PUT /api/watchlist/{item_id}` - Update watchlist item
- `DELETE /api/watchlist/{item_id}` - Remove from watchlist
- `GET /api/watchlist/check/{patent_number}` - Check if patent is in watchlist
- `GET /api/watchlist/count` - Get watchlist count

### Alerts (`/api/alerts`)

- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/{alert_id}` - Update alert
- `DELETE /api/alerts/{alert_id}` - Delete alert
- `POST /api/alerts/{alert_id}/read` - Mark alert as read
- `POST /api/alerts/read-all` - Mark all alerts as read
- `GET /api/alerts/count` - Get alerts count
- `GET /api/alerts/types` - Get alerts by type

## Testing

### Run all tests

```bash
pytest
```

### Run specific test files

```bash
pytest tests/test_patents.py
pytest tests/test_watchlist.py
pytest tests/test_alerts.py
```

### Run with coverage

```bash
pytest --cov=app --cov-report=html
```

### Run async tests

```bash
pytest --asyncio-mode=auto
```

## Database Migrations

### Create a new migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migrations

```bash
alembic downgrade -1
```

## External API Integration

### SerpAPI

The application integrates with SerpAPI for patent search. You'll need to:

1. Sign up for a SerpAPI account
2. Get your API key
3. Add it to your `.env` file

### PatentsView API

The application uses the USPTO PatentsView API for patent data. This is a free API that doesn't require authentication.

### LinkedIn Integration

The LinkedIn service is a placeholder implementation. To use the actual LinkedIn API, you'll need to:

1. Register your application with LinkedIn
2. Get API credentials
3. Implement proper authentication

## Development

### Code Style

The project follows PEP 8 guidelines. Consider using:

- **Black**: Code formatter
- **isort**: Import sorter
- **flake8**: Linter

### Pre-commit Hooks

Consider setting up pre-commit hooks for code quality:

```bash
pip install pre-commit
pre-commit install
```

## Deployment

### Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

Make sure to set all required environment variables in your deployment environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.
