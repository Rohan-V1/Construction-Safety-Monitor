# Construction Safety Monitor

AI-powered construction site safety monitor for detecting workers and PPE compliance from uploaded images or a live webcam stream. The app combines a React/Vite frontend, an Express + Socket.IO backend, a Python YOLO inference pipeline, and PostgreSQL analytics storage.

## What It Does

- Detects people in construction-site images or webcam frames.
- Checks each detected worker for required PPE:
  - Hardhat
  - Safety vest
  - Mask, when detected by the model
- Flags PPE violations when a worker is missing either a hardhat or safety vest.
- Draws real-time bounding boxes over the uploaded image or webcam feed.
- Streams detection and analytics updates to the frontend through Socket.IO.
- Stores the latest analytics snapshot in PostgreSQL/Neon.
- Displays current and persisted safety metrics in the dashboard.

## Project Structure

```text
Construction-Safety-Monitor/
+-- ai-model/
|   +-- detect.py              # YOLO inference script used by the backend
|   +-- best.pt                # Custom PPE model weights
|   +-- yolov8m.pt             # Person detection model weights
|   +-- train.ipynb            # Model training notebook
|   +-- test.jpg               # Sample image
|   +-- test1.jpg              # Sample image
+-- backend/
|   +-- server.js              # Express + Socket.IO server
|   +-- routes/
|   |   +-- detection.js       # POST /detect endpoint
|   |   +-- analytics.js       # GET /analytics/latest endpoint
|   +-- services/
|   |   +-- yoloService.js     # Node wrapper around ai-model/detect.py
|   |   +-- db.js              # PostgreSQL connection
|   +-- package.json
+-- frontend/
    +-- src/
    |   +-- App.jsx            # Main UI and mode switching
    |   +-- socket.js          # Socket.IO client
    |   +-- components/
    |       +-- Upload.jsx
    |       +-- Webcam.jsx
    |       +-- CanvasOverlay.jsx
    |       +-- AnalyticsPanel.jsx
    |       +-- AnalyticsDashboard.jsx
    +-- package.json
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Socket.IO Client |
| Backend | Node.js, Express 5, Socket.IO, Multer |
| AI inference | Python, OpenCV, Ultralytics YOLO |
| Database | PostgreSQL, Neon-compatible connection |
| Model files | `yolov8m.pt` for person detection, `best.pt` for PPE detection |

## How The System Works

1. The user chooses either **Image Upload** or **Live Webcam** in the frontend.
2. The frontend sends an image/frame as multipart form data to `POST http://localhost:5000/detect`.
3. The backend stores the uploaded frame temporarily through Multer.
4. `backend/services/yoloService.js` runs `ai-model/detect.py` with the uploaded file path.
5. The Python script:
   - Detects people using `yolov8m.pt`.
   - Crops each person region.
   - Runs the custom PPE model `best.pt` on each crop.
   - Computes violation and compliance metrics.
   - Prints JSON to stdout.
6. The backend parses the JSON result.
7. The backend emits:
   - `detections` for bounding-box rendering.
   - `analytics` for live safety metrics.
8. The backend inserts the analytics snapshot into the `safety_analytics` table.
9. The frontend renders bounding boxes with `CanvasOverlay` and displays analytics panels.

## Prerequisites

Install the following before running the project:

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- PostgreSQL database, or a Neon database
- A webcam, if you want to use live detection
- Optional but recommended: CUDA-capable GPU for faster YOLO inference

## Backend Setup

From the repository root:

```bash
cd backend
npm install
npm start
```

The backend starts at:

```text
http://localhost:5000
```

### Backend Scripts

```bash
npm start
```

Runs `nodemon server.js`.

## Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at:

```text
http://localhost:5173
```

## AI Model Setup

The backend expects a Python virtual environment at:

```text
ai-model/venv/Scripts/python.exe
```

That path is currently hardcoded in:

```text
backend/services/yoloService.js
```

Create and activate the environment from `ai-model`:

```bash
cd ai-model
python -m venv venv
venv\Scripts\activate
pip install ultralytics opencv-python
```

The inference script expects these model files:

```text
ai-model/yolov8m.pt
ai-model/best.pt
```

Run a direct model test with:

```bash
python detect.py test.jpg
```

Expected output is JSON with `detections` and `analytics`.

## Database Setup

The backend writes analytics to a PostgreSQL table named `safety_analytics`.

Create the table with:

```sql
CREATE TABLE safety_analytics (
  id SERIAL PRIMARY KEY,
  people_count INTEGER NOT NULL,
  violations INTEGER NOT NULL,
  helmet_missing INTEGER NOT NULL,
  vest_missing INTEGER NOT NULL,
  compliance_rate NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The current database connection is configured in:

```text
backend/services/db.js
```

For production or public sharing, move the connection string into an environment variable:

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

Then create a backend `.env` file or configure the variable in your hosting provider:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

## API Reference

### `POST /detect`

Runs detection on an uploaded image/frame.

Request:

```text
Content-Type: multipart/form-data
Field name: file
```

Example:

```bash
curl -X POST http://localhost:5000/detect \
  -F "file=@../ai-model/test.jpg"
```

Successful response:

```json
{
  "success": true,
  "result": {
    "detections": [
      {
        "person_bbox": [10, 20, 300, 460],
        "ppe": {
          "hardhat": true,
          "safety_vest": false,
          "mask": false
        },
        "ppe_boxes": [
          {
            "class": "hardhat",
            "bbox": [40, 30, 100, 90]
          }
        ],
        "violation": true
      }
    ],
    "analytics": {
      "people_count": 1,
      "violations": 1,
      "helmet_missing": 0,
      "vest_missing": 1,
      "compliance_rate": 0
    }
  }
}
```

### `GET /analytics/latest`

Returns the latest analytics row stored in PostgreSQL.

Example:

```bash
curl http://localhost:5000/analytics/latest
```

Example response:

```json
{
  "id": 12,
  "people_count": 3,
  "violations": 1,
  "helmet_missing": 1,
  "vest_missing": 0,
  "compliance_rate": "66.67",
  "created_at": "2026-05-17T12:30:00.000Z"
}
```

## Socket.IO Events

The frontend connects to:

```text
http://localhost:5000
```

### `detections`

Emitted after each successful detection request. Used by `CanvasOverlay.jsx` to draw bounding boxes.

Payload:

```json
[
  {
    "person_bbox": [10, 20, 300, 460],
    "ppe": {
      "hardhat": true,
      "safety_vest": false,
      "mask": false
    },
    "ppe_boxes": [],
    "violation": true
  }
]
```

### `analytics`

Emitted after each successful detection request. Used by `AnalyticsPanel.jsx`.

Payload:

```json
{
  "people_count": 3,
  "violations": 1,
  "helmet_missing": 1,
  "vest_missing": 0,
  "compliance_rate": 66.67
}
```

## Frontend Features

### Image Upload

`Upload.jsx` lets the user select an image from disk. The image is displayed locally, sent to the backend, and annotated when detections arrive through Socket.IO.

### Live Webcam

`Webcam.jsx` requests webcam access through the browser and captures a frame every 600 ms. Each frame is sent to the backend for detection.

### Canvas Overlay

`CanvasOverlay.jsx` draws:

- Person bounding boxes
- PPE bounding boxes
- Violation labels
- Green boxes for compliant detections
- Red boxes for PPE violations

### Analytics

`AnalyticsPanel.jsx` displays live analytics from Socket.IO.

`AnalyticsDashboard.jsx` fetches the latest stored analytics row from the backend.

## Running The Full App

Use three terminals when starting from a clean machine:

Terminal 1:

```bash
cd ai-model
python -m venv venv
venv\Scripts\activate
pip install ultralytics opencv-python
```

Terminal 2:

```bash
cd backend
npm install
npm start
```

Terminal 3:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Troubleshooting

### `Person model not found`

Make sure this file exists:

```text
ai-model/yolov8m.pt
```

### `PPE model not found`

Make sure this file exists:

```text
ai-model/best.pt
```

### `Invalid JSON from Python`

The backend expects `detect.py` to print JSON only. Any extra Python logs printed to stdout can break parsing. Keep YOLO verbose logging disabled.

### `spawn ai-model/venv/Scripts/python.exe ENOENT`

Create the Python virtual environment at the expected path, or update `PYTHON` in `backend/services/yoloService.js`.

### Webcam does not start

Check that:

- Browser camera permission is allowed.
- The frontend is running on `http://localhost:5173`.
- No other application is currently using the webcam.

### CORS errors

The backend is configured to allow:

```text
http://localhost:5173
```

If the frontend runs on a different port, update the CORS origin in `backend/server.js` and the Socket.IO client URL in `frontend/src/socket.js`.

### Database insert fails

Check that:

- The database connection string is valid.
- The `safety_analytics` table exists.
- The database allows SSL if using Neon.
- Your IP/network is allowed by the database provider.

## Known Limitations

- The Python path is hardcoded for a Windows virtual environment.
- Uploaded files are stored under `backend/uploads` and are not automatically cleaned up.
- Detection speed depends heavily on hardware and model size.
- The webcam mode sends frames frequently, which can overload slower machines.
- The database connection string should be moved to an environment variable before publishing the project.
- There are no automated tests configured yet.

## Suggested Improvements

- Move database and service URLs into environment variables.
- Add upload cleanup after each detection.
- Add loading/error states for detection requests.
- Add historical analytics charts.
- Add configurable frame capture interval for webcam mode.
- Add Docker support for consistent Python/Node setup.
- Add automated backend route tests and frontend component tests.
- Add role-based dashboards for supervisors or safety officers.

## Hackathon Demo Flow

1. Start the backend and frontend.
2. Open `http://localhost:5173`.
3. Upload `ai-model/test.jpg` or another construction-site image.
4. Point out the bounding boxes and violation colors.
5. Switch to **Live Webcam**.
6. Show the live analytics panel updating.
7. Refresh the page and show that the latest analytics are loaded from the database.

## License

This project is currently marked as ISC in the backend package metadata.
