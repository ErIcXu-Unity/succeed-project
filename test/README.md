# 🧪 Test Directory — UNSW Escape Room Education Platform

This directory contains **all backend and frontend tests** for the UNSW Escape Room Education Platform, following a unified testing architecture. It mirrors the original Chinese documentation, expanded and polished for clarity and use on GitHub.

---

## 📁 Directory Structure

```
test/
├── backend/                         # Backend tests
│   ├── conftest.py                  # Pytest configuration & fixtures
│   ├── test_auth.py                 # Authentication tests
│   ├── test_tasks.py                # Task management tests
│   ├── test_questions.py            # Question management tests
│   ├── test_models.py               # Data model tests
│   └── test_integration.py          # Integration tests
├── frontend/                        # Frontend tests
│   ├── Login.test.js                # Login component tests
│   ├── QuestionCreateModal.test.js  # Question creation modal tests
│   └── ...more component tests
├── pytest.ini                       # Pytest configuration
└── README.md                        # This file
```

> **Notes**
>
> - Backend tests target the Flask/SQLAlchemy application.
> - Frontend tests use React Testing Library + Jest.
> - End‑to‑end (E2E) tests (if any, e.g., Cypress) live outside this folder in their own `e2e/` directory.

---

## 🚀 Quick Start

### Run all backend tests

```bash
cd test
pytest backend
```

### Run a specific test file

```bash
cd test
pytest backend/test_auth.py
```

### Generate an HTML coverage report

```bash
cd test
pytest --cov=../backend --cov-report=html:../htmlcov backend
# Open ../htmlcov/index.html in your browser
```

### Generate a terminal coverage report (with missing lines)

```bash
cd test
pytest --cov=../backend --cov-report=term-missing backend
```

### Use the test runner script (recommended)

```bash
# From the project root
python run_tests.py --backend
python run_tests.py --frontend
python run_tests.py --all
```

---

## 📝 Test Documentation

### Backend Tests

- **`test_auth.py` — Authentication**

  - Student sign‑up and login
  - Password validation
  - Permission/role checks

- **`test_tasks.py` — Task Management**

  - Task CRUD
  - Access control
  - Task–question associations

- **`test_questions.py` — Question Management**

  - Creation of six question types
  - Payload/data validation
  - Question–task associations

- **`test_models.py` — Data Models**

  - Model creation and validation
  - Relationship integrity
  - Constraint enforcement

- **`test_integration.py` — Integration**
  - End‑to‑end user journeys
  - Cross‑module interactions
  - Error handling flows

### Frontend Tests

- **`Login.test.js` — Login Component**

  - Form rendering and interactions
  - API calls and response handling
  - Navigation and error states

- **`QuestionCreateModal.test.js` — Question Creation Modal**
  - Multiple question type support
  - Form validation rules
  - Modal UI interactions

---

## 🛠️ Development Guide

### Adding a New Backend Test

1. Create a file in `test/backend/` named `test_*.py`.
2. Import required modules and ensure the project root is on `PYTHONPATH`:

   ```python
   import pytest
   import json
   import sys
   import os

   # Add project root to Python path
   sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

   from models import db, YourModel
   ```

3. Reuse fixtures from `conftest.py` (app, client, auth headers, seed data).
4. Follow the **AAA** pattern: _Arrange, Act, Assert_.
5. Keep tests deterministic; avoid relying on wall‑clock time or external services.

### Adding a New Frontend Test

1. Create a file in `test/frontend/` named `*.test.js`.
2. Import testing tools and the component:
   ```javascript
   import React from "react";
   import { render, screen, fireEvent, waitFor } from "@testing-library/react";
   import "@testing-library/jest-dom";
   import YourComponent from "../../src/components/YourComponent";
   ```
3. Mock external dependencies (fetch/axios, routing, context providers, etc.).
4. Prefer user‑facing assertions (query by role/label) over implementation details.

---

## 🔧 Configuration Files

### `pytest.ini`

Defines:

- Test discovery paths
- Coverage configuration
- Custom markers
- Output/reporting options

### `conftest.py`

Centralised Pytest fixtures, including:

- **Application factory/instance**
- **Test client** (authenticated and anonymous)
- **Seed test data** (students, teachers, tasks, questions)
- **Authorisation headers / tokens**
- **Database session/cleanup hooks**

> **Database isolation**: Each test case uses a dedicated **SQLite in‑memory database**, created and torn down per test class or function (as configured), ensuring isolation and reproducibility.

---

## 📊 Test Markers

Use markers to categorise and filter tests:

```bash
# Run quick tests (exclude slow)
pytest -m "not slow" backend

# Run integration tests
pytest -m "integration" backend

# Run unit tests
pytest -m "unit" backend

# Run API tests
pytest -m "api" backend
```

You can combine markers:

```bash
pytest -m "integration and not slow" backend
```

---

## 🐛 Debugging Tips

### Verbose output

```bash
pytest -v -s backend/test_auth.py
```

### Re‑run only failed tests

```bash
pytest --lf backend
```

### Drop into the debugger on failure

```bash
pytest --pdb backend/test_auth.py::TestLogin::test_successful_login
```

### Coverage with missing lines in terminal

```bash
pytest --cov=../backend --cov-report=term-missing backend
```

> If imports fail, verify `PYTHONPATH` manipulation in tests (see the snippet in _Adding a New Backend Test_), or run tests via `run_tests.py` which sets paths for you.

---

## 🚨 Important Notes

1. **Path dependencies**: Ensure the backend package is importable in tests (via `sys.path` update or an editable install).
2. **Database isolation**: Tests must not leak state; fixtures should roll back or recreate the DB between tests.
3. **Mock strategy**: Frontend tests should mock API calls and routing; avoid hitting live services.
4. **Test data**: Prefer reusable fixtures over inline data duplication.
5. **Cleanup**: All temporary files, state, and database rows are cleaned automatically by fixtures.

---

## 📚 More Information

For detailed testing conventions and project‑wide guidance, see `TESTING.md` in the project root.

---

**Maintainer**: UNSW Escape Room Education Platform Development Team  
**Last Updated**: 2025
