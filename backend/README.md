# DailyForge Backend API

## Setup & Installation

### 1. Install Dependencies
```bash
cd c:\Users\likhi\OneDrive\Pictures\Desktop\DailyForge\project-2\x\backend\backend
pip install -r requirements.txt
```

### 2. Database Configuration
- **Database**: PostgreSQL
- **Name**: mydb
- **User**: postgres
- **Password**: 1234567890
- **Host**: localhost
- **Port**: 5432

Make sure PostgreSQL is running and the database `mydb` exists:
```sql
CREATE DATABASE mydb;
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser (for admin panel)
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

The API will be available at http://localhost:8000/

## API Endpoints

### Health Check
- **GET** `/api/health/` - Check if backend is running

### Authentication
For now, the API uses session authentication. You'll need to:
1. Create a user via admin panel or Django shell
2. Authenticate requests with session cookies

### Habits
- **GET** `/api/habits/` - List all habits
- **POST** `/api/habits/` - Create a new habit
- **GET** `/api/habits/{id}/` - Get a specific habit
- **PUT** `/api/habits/{id}/` - Update a habit
- **PATCH** `/api/habits/{id}/` - Partial update
- **DELETE** `/api/habits/{id}/` - Delete a habit

**Habit Fields:**
```json
{
  "id": 1,
  "name": "Morning Exercise",
  "frequency": 1,
  "created_at": "2026-01-02",
  "completed_by_date": {"2026-01-02": true, "2026-01-03": false},
  "paused": false
}
```

### Expenses
- **GET** `/api/expenses/` - List all expenses
- **POST** `/api/expenses/` - Create a new expense
- **GET** `/api/expenses/{id}/` - Get a specific expense
- **PUT** `/api/expenses/{id}/` - Update an expense
- **PATCH** `/api/expenses/{id}/` - Partial update
- **DELETE** `/api/expenses/{id}/` - Delete an expense

**Expense Fields:**
```json
{
  "id": 1,
  "title": "Groceries",
  "amount": "150.50",
  "date": "2026-01-02",
  "time": "14:30:00",
  "description": "Weekly shopping",
  "is_recurring": false,
  "category": "Food"
}
```

### Categories
- **GET** `/api/categories/` - List all categories
- **POST** `/api/categories/` - Create a new category
- **GET** `/api/categories/{id}/` - Get a specific category
- **PUT** `/api/categories/{id}/` - Update a category
- **PATCH** `/api/categories/{id}/` - Partial update
- **DELETE** `/api/categories/{id}/` - Delete a category

**Category Fields:**
```json
{
  "id": 1,
  "name": "Food",
  "color": "#ff6b6b",
  "budget": "500.00"
}
```

### Tasks
- **GET** `/api/tasks/` - List all tasks
- **POST** `/api/tasks/` - Create a new task
- **GET** `/api/tasks/{id}/` - Get a specific task
- **PUT** `/api/tasks/{id}/` - Update a task
- **PATCH** `/api/tasks/{id}/` - Partial update
- **DELETE** `/api/tasks/{id}/` - Delete a task

**Task Fields:**
```json
{
  "id": 1,
  "title": "Complete project",
  "description": "Finish the Django integration",
  "quadrant": "urgent_important",
  "completed": false,
  "created_at": "2026-01-02T10:30:00Z"
}
```

**Quadrant Options:**
- `urgent_important`
- `not_urgent_important`
- `urgent_not_important`
- `not_urgent_not_important`

### Notes
- **GET** `/api/notes/` - List all notes
- **POST** `/api/notes/` - Create a new note
- **GET** `/api/notes/{id}/` - Get a specific note
- **PUT** `/api/notes/{id}/` - Update a note
- **PATCH** `/api/notes/{id}/` - Partial update
- **DELETE** `/api/notes/{id}/` - Delete a note

**Note Fields:**
```json
{
  "id": 1,
  "title": "Meeting Notes",
  "content": "Discussed project timeline",
  "created_at": "2026-01-02T10:30:00Z",
  "updated_at": "2026-01-02T11:00:00Z"
}
```

### Timer Sessions
- **GET** `/api/timer-sessions/` - List all timer sessions
- **POST** `/api/timer-sessions/` - Create a new timer session
- **GET** `/api/timer-sessions/{id}/` - Get a specific session
- **PUT** `/api/timer-sessions/{id}/` - Update a session
- **PATCH** `/api/timer-sessions/{id}/` - Partial update
- **DELETE** `/api/timer-sessions/{id}/` - Delete a session

**Timer Session Fields:**
```json
{
  "id": 1,
  "duration": 1500,
  "task_name": "Study Session",
  "created_at": "2026-01-02T10:30:00Z"
}
```

## Admin Panel
Access the Django admin at http://localhost:8000/admin/ to manage:
- Users
- All data models
- Inspect database records

## CORS Configuration
The backend is configured to accept requests from:
- http://localhost:5173 (Vite dev server)
- http://127.0.0.1:5173

## Next Steps

### For Development:
1. Update React `api.js` to use Django endpoints instead of localStorage
2. Add user authentication (login/register endpoints)
3. Test all CRUD operations from React frontend

### For Production:
1. Use `django-cors-headers` instead of custom middleware
2. Set `DEBUG = False` in settings
3. Use environment variables for secrets
4. Configure proper authentication (JWT tokens)
5. Set up proper static file serving
6. Use a production-grade database setup
