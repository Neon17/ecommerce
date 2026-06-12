# 🛒 E-Commerce (Django + React)

A full-stack e-commerce app I'm building while learning backend development.
Django REST Framework powers the API, and a React + TypeScript + Tailwind
frontend talks to it — products, categories, and a working cart flow.

This is a **learning-by-doing** project: I follow along with tutorials, then
push past them by wiring up my own frontend, fixing the rough edges, and making
the pieces actually fit together. Every bug here is a thing I now understand. 🚀

> 📺 Backend learning is guided by **Mohit Decodes — Django tutorial**
> playlist: https://youtube.com/playlist?list=PLsjpRo2EZP1K_glKX0lG6BkviJFxjuGls

---

## ✨ Features

- 📦 Product & category listing (Django REST Framework APIs)
- 🔍 Product detail pages
- 🛒 Cart flow — add, update quantity, remove, live total
- 🎨 Clean, responsive UI with Tailwind CSS
- 🖼️ Media/image handling served from Django in development

## 🧰 Tech Stack

**Backend**
- Python · Django · Django REST Framework
- django-cors-headers (for talking to the Vite dev server)
- SQLite (default dev database)

**Frontend**
- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS

## 📁 Project Structure

```
ecommerce/
├── backend/          # Django project + REST API
│   ├── backend/      # settings, root urls
│   ├── store/        # models, serializers, views, urls (products, cart, …)
│   ├── media/        # uploaded product images
│   └── manage.py
└── frontend/         # React + TypeScript + Tailwind (Vite)
    └── src/
        ├── pages/        # ProductList, ProductDetails, CartPage
        ├── context/      # CartContext (cart state + API calls)
        ├── components/   # Navbar, etc.
        └── types/        # shared TypeScript types
```

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py runserver        # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Create a `frontend/.env` so the app knows where the API lives:

```
VITE_DJANGO_BASE_URL=http://localhost:8000
```

## 🔌 API Overview

| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ----------------------- |
| GET    | `/api/products/`          | List products           |
| GET    | `/api/products/<id>/`     | Product detail          |
| GET    | `/api/categories/`        | List categories         |
| GET    | `/api/cart/`              | Get current cart        |
| POST   | `/api/cart/add/`          | Add product to cart     |
| POST   | `/api/cart/update/`       | Set item quantity       |
| POST   | `/api/cart/remove/`       | Remove item from cart   |

## 🌱 What I'm Learning

This project is my hands-on playground for understanding how a real frontend and
backend fit together: REST API design, serializers, request/response shapes,
React state management with Context, and connecting the two without things
silently breaking. I love figuring out *why* something works — not just that it
does. More features (auth, orders, checkout) are on the way as I keep learning. 💡

---

*Built with curiosity, coffee, and a lot of "let me just try one more thing." ☕*
