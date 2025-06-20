As practice, I decided to code up a solution to this prompt:

“Design a restaurant reservation platform (like OpenTable or Resy) that allows users to search for restaurants and make real-time reservations. You should support high-end restaurants with limited seating, multiple turn times, and complex rules like table joins, holds, and cancellation policies.”

⸻

🧩 Goals / Requirements

Functional:
- Search for restaurants by location, cuisine, and availability. ✅
- View restaurant availability in real-time. ✅ (can view availability but no real-time websocket updates)
- Make, modify, and cancel reservations. ✅
- Restaurants can configure: 
- Table layouts (e.g. table joins for large parties) - ✅ via Table model with isJoinable for table joins, no config UI
- Turn times (e.g. 90 minutes per seating) - ✅ via TurnTimeRule model (different turn times by party size), no config UI
- Blackout periods (e.g. private events) - ✅ via SpecialPeriod model with isBlackout flag, no config UI
- No-show and cancellation policies. - ✅ via CancellationPolicy model, no config UI

Non-Functional:
- High availability and low-latency (esp. for booking flow). ❌
- Handle traffic spikes (e.g., 7 PM slots at popular restaurants) ❌
- Strong consistency for reservation confirmation. ❌
- Multi-tenant (many restaurants, each with custom configs). ❌
- Mobile and web clients (assume API backend) - web client only 


## Getting Started

With docker compose, run the command

```bash
docker compose up --build
```

That will start the postgres database and seed it with some reservations


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Tech Details

This project uses 
- next.js 
- postgres 
- prisma orm
- vitest + next-test-api-route-handler
- shadcn
- tailwind v4
- docker & docker compose