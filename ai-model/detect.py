from pathlib import Path
import sys
import json
import cv2
import os
from ultralytics import YOLO

# -------------------------------
# SILENCE YOLO LOGS
# -------------------------------
os.environ["YOLO_VERBOSE"] = "False"

# -------------------------------
# BASE PATHS
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent

PERSON_MODEL_PATH = BASE_DIR / "yolov8m.pt"
PPE_MODEL_PATH = BASE_DIR / "best.pt"

# -------------------------------
# VALIDATE MODEL FILES
# -------------------------------
if not PERSON_MODEL_PATH.exists():
    print(json.dumps({"error": f"Person model not found at {PERSON_MODEL_PATH}"}))
    sys.exit(1)

if not PPE_MODEL_PATH.exists():
    print(json.dumps({"error": f"PPE model not found at {PPE_MODEL_PATH}"}))
    sys.exit(1)

# -------------------------------
# LOAD MODELS (ONCE)
# -------------------------------
person_model = YOLO(PERSON_MODEL_PATH)
ppe_model = YOLO(PPE_MODEL_PATH)

# -------------------------------
# INPUT IMAGE
# -------------------------------
if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]
img = cv2.imread(image_path)

if img is None:
    print(json.dumps({"error": f"Unable to read image {image_path}"}))
    sys.exit(1)

# -------------------------------
# DETECTION PIPELINE
# -------------------------------
output = []

person_results = person_model(
    img,
    conf=0.5,
    classes=[0],
    device=0,
    verbose=False      # ⭐ IMPORTANT
)

for r in person_results:
    for box in r.boxes.xyxy:
        x1, y1, x2, y2 = map(int, box)

        if x2 <= x1 or y2 <= y1:
            continue

        person_crop = img[y1:y2, x1:x2]
        if person_crop.size == 0:
            continue

        ppe_results = ppe_model(
            person_crop,
            conf=0.4,
            device=0,
            verbose=False   # ⭐ IMPORTANT
        )

        found = {
            "hardhat": False,
            "safety_vest": False,
            "mask": False
        }

        ppe_boxes = []

        for p in ppe_results:
            for b, cls in zip(p.boxes.xyxy, p.boxes.cls):
                cls_id = int(cls)
                cls_name = ppe_model.names[cls_id]

                if cls_name in found:
                    found[cls_name] = True

                px1, py1, px2, py2 = map(int, b)

                ppe_boxes.append({
                    "class": cls_name,
                    "bbox": [
                        x1 + px1,
                        y1 + py1,
                        x1 + px2,
                        y1 + py2
                    ]
                })

        violation = not (found["hardhat"] and found["safety_vest"])

        output.append({
            "person_bbox": [x1, y1, x2, y2],
            "ppe": found,
            "ppe_boxes": ppe_boxes,
            "violation": violation
        })

# -------------------------------
# PRINT JSON ONLY (CRITICAL)
# -------------------------------
analytics = {
    "people_count": len(output),
    "violations": sum(1 for o in output if o["violation"]),
    "helmet_missing": sum(1 for o in output if not o["ppe"]["hardhat"]),
    "vest_missing": sum(1 for o in output if not o["ppe"]["safety_vest"]),
}

analytics["compliance_rate"] = (
    0 if analytics["people_count"] == 0
    else round(
        (analytics["people_count"] - analytics["violations"])
        / analytics["people_count"] * 100,
        2
    )
)

print(json.dumps({
    "detections": output,
    "analytics": analytics
}))

