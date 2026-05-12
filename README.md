# EventPulse

EventPulse is a full-stack event operations and monitoring system developed for the Software Project Management course. It simulates a professional festival/event control center with ticket validation, realtime monitoring, alert management, and operational response workflows.

## Features

- Role-based login foundation
- Realtime monitoring dashboard
- Ticket validation system
- Duplicate ticket scan detection
- Live WebSocket updates
- Professional alert feed
- Alert resolve lifecycle
- Gate failure simulation
- High latency alert simulation
- Peak traffic simulation
- Auto traffic simulation
- Metrics monitoring
- Prisma database integration
- RabbitMQ mock event publishing
- Redis mock/cache layer

## Project Structure

eventpulse-final-clean
├── apps
│   ├── api          # NestJS backend
│   └── dashboard    # React + Vite dashboard

## Tech Stack

Backend:
- NestJS
- Prisma
- SQLite/PostgreSQL-ready schema
- Socket.io
- JWT authentication
- RabbitMQ mock service
- Redis mock/cache service

Frontend:
- React
- Vite
- Tailwind CSS
- Recharts
- Socket.io Client
- Lucide React Icons

## Installation & Run

```bash
git clone https://github.com/yadebaskan/eventpulse-final.git

cd eventpulse-final/apps/api
npm install
npx prisma db push
npx prisma generate
npm run seed
npm run dev

# Open second terminal

cd eventpulse-final/apps/dashboard
npm install
npm run dev
```

Backend:
http://localhost:3000

Dashboard:
http://localhost:5173

## Demo Login

Email: admin@eventpulse.com  
Password: admin123

## Main Demo Scenario

1. Login to the EventPulse dashboard.
2. Verify backend connection status.
3. Run a valid ticket scan.
4. Run the same ticket scan again to trigger duplicate detection.
5. Observe the realtime alert feed.
6. Trigger a gate failure alert.
7. Resolve the alert from the dashboard.
8. Toggle peak traffic simulation.
9. Observe realtime metrics and traffic updates.

## API Endpoints

### Auth

POST /auth/login

### Metrics

GET /metrics/public

### Tickets

GET /tickets/validate/:code  
POST /tickets/reset  
POST /tickets/simulate  
POST /tickets/bulk-simulate/:count  
POST /tickets/toggle-peak  
POST /tickets/toggle-auto

### Alerts

GET /alerts  
POST /alerts  
POST /alerts/gate-failure  
POST /alerts/high-latency  
POST /alerts/invalid-scan-spike  
POST /alerts/sync-queue  
POST /alerts/:id/resolve

## Monitoring Metrics

- Total entries
- Active gates
- Live crowd count
- Latency
- Error rate
- Sync queue
- Staff efficiency
- Revenue projection
- Alert severity
- Incident resolution status

## Software Project Management Relevance

This project demonstrates:

- Management monitoring
- Technical monitoring
- Risk management
- Incident response lifecycle
- Stakeholder-oriented dashboard design
- Scalability simulation
- Maintainable modular architecture
- Operational value creation
- Real-time event-driven system design

## Team Role Mapping

- Project Manager
- Lead Developer
- QA/Tester
- UX/UI Designer
- Risk Manager
- Operations Lead

## Notes

RabbitMQ and Redis are mocked for local standalone execution. The system is designed so these services can be replaced with real infrastructure in production deployment.

## Status

Current version includes a working full-stack prototype with realtime dashboard, backend APIs, authentication foundation, ticket validation, alert lifecycle, and traffic simulation.
