```mermaid
graph TD
  subgraph Cloudflare Pages
    UI[Installer UI (Astro)] -->|POST /api/install| API
    Blog[Blog pages] --> API
  end
  subgraph Workers
    API[API Worker] --> D1[(D1 DB)]
    API --> KV[(KV Cache)]
    API --> R2[(R2 Media)]
    API --> Q[Queues]
    API --> AE[Analytics Engine]
    Cron[Cron Worker] --> Q
    Q -->|generate| AI[Gemini/Workers AI]
    Q --> D1
    Email[Email Worker] --> Subscribers
  end
  subgraph External
    Gemini[Gemini 2.5 Flash]
  end
  AI --> R2
  Q --> Email
  API --> RSS[RSS/Sitemap]
  Blog --> Users
```
