# Second Face

A Django web application for **face anonymization**—helping people share video or images of themselves without revealing their real identity.

## Purpose

**Second Face** is built for survivors and victims of abuse who want to tell their stories publicly or privately while reducing the risk of being recognized. Real faces can put people in danger; this project aims to replace visible identity with plausible, synthetic alternatives so testimony and storytelling remain human and expressive without exposing who someone is.

## How it will work (planned)

The application will use [**Magic Hour**](https://magichour.ai/) AI products to anonymize faces in photos and video by swapping them with **AI-generated synthetic faces**. The goal is natural-looking output that preserves emotion and pacing where possible, while decoupling the visible face from the person behind the story.

This repository currently contains only the **standard Django project boilerplate** (`config` project, `manage.py`). Features such as upload flows, processing pipelines, Magic Hour API integration, and user-facing UI are not implemented yet.

## Tech stack

- [Django](https://www.djangoproject.com/) 4.2 (Python web framework)
- Planned integration: Magic Hour AI for synthetic face generation and anonymization

## Getting started

### Prerequisites

- Python 3.9+ (or compatible with your Django version)
- `pip` and `venv`

### Setup

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) to see the default Django welcome page.

### Common commands

```bash
python manage.py migrate          # apply database migrations
python manage.py createsuperuser  # Django admin user
python manage.py runserver        # development server
```

## Project layout

```
second-face/
├── config/          # Django project settings (settings, urls, wsgi/asgi)
├── manage.py        # Django management CLI
├── requirements.txt
└── README.md
```

## Safety and ethics (intent)

This tool is intended to **protect** people, not to facilitate deception or harm. Future development should emphasize informed consent, clear disclosure where appropriate, secure handling of media, and policies aligned with survivor safety and legal context in your jurisdiction.

## License

Add a license when you are ready to distribute the project.