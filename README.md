# Agri Advisor Pro

# ROLE



You are a senior AI engineer, full-stack architect, UI/UX designer, computer-vision engineer, data scientist, and 3D web developer.



I am a beginner with almost no coding knowledge.



You are going to BUILD the complete project for me, not just explain how to build it.



Do not give me incomplete pseudo-code.



Create a production-quality hackathon MVP that can actually run locally and can be deployed.



---



# PROJECT



Build an AI-powered 3D web application called:



## "AgriShield AI"



Tagline:



### "From Field Image to Intelligent Action."



The goal is to help farmers detect crop diseases/pests from photographs and combine that diagnosis with real-time location, weather, soil and crop information to produce a clear, actionable agricultural advisory.



The core problem is:



"Build an AI-powered webapp that solves for farmer livelihood and food security by acting as a real-time bridge between raw field conditions and expert agronomic guidance. Participants must create a functional interface that takes unstructured, real-world inputs — a photo of a diseased leaf, a farmer's location, live weather signals — and instantly converts them into a clear, actionable advisory: what's wrong with the crop, how to treat it, and when it's safe to act based on the coming weather."



---



# IMPORTANT



I do NOT know how to code.



Therefore:



1. Build the project completely.

2. Give me exact installation commands.

3. Give me exact environment variables.

4. Give me exact file names.

5. Give me exact commands to run the application.

6. Handle errors gracefully.

7. Never leave TODO placeholders for essential functionality.

8. Never give pseudocode where working code is possible.

9. Explain only what I need to do.

10. Make reasonable technical decisions without repeatedly asking me questions.



If an external API requires a key, create a clear `.env.example` file and provide instructions.



Where an API can work without a key, prefer it.



---



# PRIMARY USER FLOW



The farmer opens the application.



STEP 1:



The application asks:



"What crop are you growing?"



Allow:



* Rice

* Tomato

* Cotton

* Chilli

* Maize

* Potato

* Wheat

* Other



Also allow custom crop entry.



STEP 2:



The farmer uploads or captures a leaf image.



Support:



* JPG

* JPEG

* PNG

* Camera capture on mobile



STEP 3:



Ask for location.



Provide:



* Use my current location

* Enter location manually

* Select location on map



Automatically obtain:



* latitude

* longitude

* district

* state

* country



STEP 4:



Retrieve live weather for that location.



Include:



* temperature

* humidity

* rainfall

* precipitation probability

* wind speed

* UV

* cloud cover

* forecast

* sunrise

* sunset



STEP 5:



Analyze the uploaded image using a computer-vision/multimodal AI system.



Identify:



* crop

* disease

* pest

* healthy condition

* visible symptoms

* confidence

* severity



STEP 6:



Combine the image diagnosis with:



* location

* weather

* forecast

* soil/context information

* crop

* crop growth stage if provided



STEP 7:



Generate an agricultural advisory.



---



# ADVISORY OUTPUT



The final answer must contain:



## Diagnosis



Crop:

Disease/Pest:

Confidence:

Severity:



## What the AI sees



List the visual symptoms detected.



## Why this diagnosis



Explain the reasoning in simple language.



## What to do now



Provide prioritized actions.



## Treatment



Provide safe, evidence-grounded treatment guidance.



Never invent pesticide dosage.



For chemical recommendations, clearly state that farmers must follow locally approved product labels and agricultural authority recommendations.



## Weather-aware action



Determine whether the farmer should act:



* NOW

* WAIT

* MONITOR



Explain why.



Example:



"Do not spray today because rainfall is likely within the next 6 hours."



or:



"Conditions appear suitable for application between 6:00 AM and 9:00 AM tomorrow."



Do not claim a precise spray window unless the weather data actually supports it.



## Risk forecast



Show:



* current disease risk

* 24-hour risk

* 48-hour risk

* 72-hour risk



Explain which weather factors influence the risk.



---



# DATA SOURCES



Use real datasets and APIs.



For disease-image training/evaluation, support:



1. PlantVillage

2. PlantDoc

3. Paddy Doctor

4. IP102 for insect/pest recognition



Do not assume PlantVillage alone is sufficient.



The system should recognize that laboratory-style datasets may not represent real farmer photographs.



Use PlantDoc and Paddy Doctor to improve real-world robustness.



For weather:



Use Open-Meteo as the default weather provider.



Use current and forecast weather.



For historical/contextual weather where useful, support NASA POWER.



For soil:



Use SoilGrids/ISRIC when available.



If SoilGrids is unavailable, implement a graceful fallback rather than breaking the application.



---



# MODEL STRATEGY



Do NOT require me to train a huge model from scratch.



Build the system using a practical hybrid architecture.



Preferred architecture:



IMAGE

↓

Vision model / crop-disease classifier

↓

Structured diagnosis JSON

↓

Weather + location + soil enrichment

↓

Agronomic reasoning engine

↓

Final advisory



The vision system must return structured JSON such as:



{

"crop": "",

"condition": "",

"disease": "",

"confidence": 0,

"severity": "",

"symptoms": [],

"alternative_diagnoses": []

}



Do not allow free-form model output to directly control the UI.



Validate AI output using schemas.



---



# CONFIDENCE SAFETY



If confidence is low:



Do NOT pretend the diagnosis is certain.



Display:



"Low confidence — please upload a clearer image."



Allow the farmer to:



* retake photo

* upload another photo

* select crop manually

* provide additional symptoms



If the image does not contain a plant/leaf:



Return:



"I couldn't reliably identify a crop leaf in this image."



---



# NEW FEATURE: MULTI-SIGNAL DIAGNOSIS



Do not rely only on the image.



Create a "Field Intelligence Score".



Example:



Image evidence: 85%

Weather evidence: 78%

Location evidence: 65%

Soil/context evidence: 52%



Combine them into a transparent confidence/risk assessment.



Do not mathematically claim medical/scientific certainty.



Label it as:



"AI Decision Support Score"



---



# NEW FEATURE: DISEASE RISK ENGINE



Create a rule/model-based disease risk engine.



Input:



* crop

* diagnosed disease

* temperature

* humidity

* rainfall

* precipitation probability

* wind

* recent weather

* forecast weather



Output:



LOW

MODERATE

HIGH

CRITICAL



Also show why.



Example:



HIGH RISK



Reasons:



* High humidity

* Recent rainfall

* Suitable temperature

* Additional rainfall expected



---



# NEW FEATURE: SPRAY SAFETY ENGINE



Create a weather-aware application timing engine.



Evaluate:



* precipitation probability

* expected rainfall

* wind speed

* humidity

* temperature

* time of day



Return:



SAFE

CAUTION

WAIT



Never give unsafe chemical instructions.



The engine must be explainable.



---



# NEW FEATURE: 3D FARM VISUALIZATION



The application MUST look like a modern 3D agricultural command center.



Use:



* React Three Fiber

* Three.js

* WebGL



Create a beautiful interactive 3D environment.



The main scene should contain:



* 3D terrain

* crop rows

* farm plots

* trees/vegetation

* weather effects

* clouds

* rain animation

* sunlight

* disease-risk visualization

* location marker



Use visual colors carefully:



GREEN = healthy

YELLOW = warning

ORANGE = moderate risk

RED = high risk

BLUE = weather/water



Make the 3D elements subtle and professional.



Do NOT make it look like a childish game.



The design should look like:



"NASA mission control + modern agricultural intelligence platform."



---



# 3D GLOBE / MAP



Include an interactive map.



When the farmer selects a location:



Show:



* location

* weather

* temperature

* rainfall

* crop risk

* nearby farm risk if data exists



Allow zooming and rotation.



The map should work even if 3D WebGL is unavailable by providing a 2D fallback.



---



# DASHBOARD



Create these sections:



1. Overview

2. Crop Doctor

3. Weather Intelligence

4. Disease Risk

5. Farm Map

6. Soil Intelligence

7. Farm History

8. Alerts

9. Settings



---



# MAIN DASHBOARD



Show:



Farm Health Score

Weather

Crop Health

Disease Risk

Next Recommended Action

Best Action Window

7-day forecast

Recent diagnoses



Example:



---



FARM HEALTH



78 / 100



🌾 Rice

📍 Andhra Pradesh



Disease Risk

🟠 Moderate



Weather

🌧 Rain expected



Next Action

Monitor leaves



Best Action Window

Tomorrow 6–9 AM



---



---



# NEW FEATURE: FARM TIMELINE



Store previous diagnoses.



For each scan save:



* image

* date

* location

* crop

* diagnosis

* confidence

* severity

* weather

* recommended action



Show a timeline.



Example:



DAY 1

Disease detected

Severity: 62%



DAY 4

Severity: 45%



DAY 7

Severity: 21%



Show whether crop health appears to be improving.



---



# NEW FEATURE: BEFORE/AFTER IMAGE COMPARISON



Allow farmers to compare:



Previous image

vs

Current image



Show:



* severity change

* visual difference

* AI interpretation



Do not claim exact biological improvement unless supported by evidence.



---



# NEW FEATURE: FARMER ALERTS



Generate alerts such as:



🌧 Heavy rainfall expected



⚠ Disease risk increasing



🌡 Temperature entering risk range



💨 Wind too strong for spraying



🌱 Crop monitoring recommended



Only generate alerts when the data supports them.



---



# NEW FEATURE: VOICE



Add microphone input.



Allow the farmer to say:



"My rice leaves have brown spots."



Convert speech into structured information.



Support English and Telugu initially.



Design the system so Hindi can be added later.



---



# NEW FEATURE: LANGUAGE



Support:



English

Telugu



The farmer should be able to switch language.



Keep the agricultural explanation simple.



Avoid unnecessarily technical terminology.



---



# NEW FEATURE: EXPLAINABLE AI



Every diagnosis must have:



"Why we think this"



Show evidence:



* image symptoms

* crop

* weather

* environmental conditions



Also show:



"Things that could make this diagnosis wrong"



This improves trust.



---



# NEW FEATURE: ALTERNATIVE DIAGNOSES



If confidence is not extremely high, show:



Possible alternatives:



1. Disease A — 71%

2. Disease B — 19%

3. Nutrient deficiency — 10%



Tell the farmer how to distinguish them.



---



# NEW FEATURE: PHOTO QUALITY CHECK



Before AI diagnosis:



Check whether:



* image is blurry

* leaf is too small

* lighting is poor

* image contains no leaf

* multiple unrelated objects exist



If poor quality:



Ask farmer to retake it.



Give simple instructions:



"Place one leaf close to the camera."



"Use natural light."



"Keep the leaf in focus."



---



# NEW FEATURE: CROP HEALTH SCORE



Create an explainable score from 0–100.



Base it on available signals:



* disease severity

* confidence

* weather risk

* recent trend

* crop condition



Do not present this as a scientifically validated agricultural index.



Call it:



"AI Crop Health Score"



---



# DATABASE



Use PostgreSQL/Supabase.



Create tables for:



users

farms

crops

scans

diagnoses

weather_snapshots

alerts

farm_history



Store timestamps.



---



# BACKEND



Use FastAPI.



Create clean REST APIs.



Example:



POST /api/diagnose

GET /api/weather

GET /api/soil

POST /api/farms

GET /api/farms/:id/history

GET /api/risk

GET /api/alerts



Use Pydantic schemas.



Validate every request and response.



---



# FRONTEND



Use:



Next.js

React

TypeScript

Tailwind CSS

React Three Fiber

Three.js



Use a clean component architecture.



Use responsive design.



The application MUST work on:



Desktop

Tablet

Mobile



---



# UI STYLE



Make it visually impressive.



Design language:



* dark agricultural intelligence dashboard

* glassmorphism

* subtle green accents

* soft gradients

* glowing data points

* animated weather

* 3D terrain

* modern typography

* smooth transitions

* premium startup aesthetic



Avoid excessive animations.



Performance is more important than visual effects.



---



# LANDING PAGE



Create a cinematic landing page.



Hero:



"AI That Understands Your Field."



Subheading:



"Turn a simple crop photo into real-time, weather-aware agricultural intelligence."



Buttons:



[Scan My Crop]



[Explore Demo Farm]



Behind the hero should be an interactive 3D farm scene.



---



# DEMO MODE



VERY IMPORTANT.



The application must include a Demo Mode.



If API keys are unavailable, the application should still work.



Provide a demo farm in Andhra Pradesh.



Provide sample crop images and simulated weather data.



Clearly label:



"DEMO DATA"



This ensures the project can be demonstrated even without internet/API credentials.



---



# REAL-TIME MODE



When API credentials and internet are available:



Use real:



* weather

* location

* AI analysis

* soil/context



Do not use fake data silently.



Show a small data source indicator.



Example:



Weather:

LIVE · Open-Meteo



Diagnosis:

AI Vision



Soil:

SoilGrids



---



# ERROR HANDLING



If weather API fails:



Continue diagnosis and show:



"Weather temporarily unavailable."



If AI API fails:



Show a useful retry state.



If soil API fails:



Continue without soil.



If location permission is denied:



Allow manual location.



The app must never crash because one external service is unavailable.



---



# SECURITY



Never expose secret API keys in frontend code.



Use environment variables.



Use backend proxy routes when required.



Validate uploaded image type and size.



Do not store unnecessary personal information.



---



# PERFORMANCE



Optimize images.



Lazy-load 3D components.



Do not load enormous models into the browser.



Show loading states.



Use caching for weather.



Avoid unnecessary API requests.



---



# ACCESSIBILITY



Use:



* readable fonts

* high contrast

* keyboard navigation

* screen-reader labels

* clear icons

* text alternatives



---



# SOURCE / TRUST LAYER



Every important agricultural recommendation should have a source or knowledge reference.



Create a Sources section.



Example:



Weather source:

Open-Meteo



Soil source:

ISRIC SoilGrids



Disease dataset:

PlantVillage / PlantDoc / Paddy Doctor



Agronomic guidance:

configured knowledge base / authoritative agricultural sources



Never fabricate sources.



---



# MODEL TRAINING PIPELINE



Create a separate `/ml` directory.



Include:



data preparation

dataset loaders

augmentation

training

validation

evaluation

inference



Use transfer learning rather than training a CNN from scratch.



Support a lightweight model suitable for deployment.



Report:



accuracy

precision

recall

F1

confusion matrix



But DO NOT fake these metrics.



If the model hasn't actually been trained, display:



"Model evaluation not yet performed."



---



# REAL-WORLD ROBUSTNESS



The system must explicitly handle the difference between:



clean dataset images



and



real farmer smartphone photographs.



Use augmentation such as:



* brightness variation

* rotation

* crop

* blur

* noise

* contrast

* background variation



Use PlantDoc/Paddy Doctor for real-world testing where appropriate.



Do not claim production-level disease accuracy from benchmark datasets alone.



---



# ARCHITECTURE



Create this project structure:



/agri-shield-ai



/frontend

/backend

/ml

/data

/database

/docs

/public

.env.example

README.md

docker-compose.yml



---



# README



Write a complete README containing:



1. Project overview

2. Problem statement

3. Features

4. Architecture

5. Data sources

6. AI pipeline

7. Installation

8. Environment variables

9. Running locally

10. Demo mode

11. Real-time mode

12. Model training

13. API documentation

14. Deployment

15. Limitations

16. Future improvements

17. Dataset citations



---



# DEMO SCENARIO



Create one polished demonstration flow:



Farmer:



Rice farmer in Andhra Pradesh.



Uploads a diseased rice leaf.



AI:



Identifies likely disease.



Location:



Andhra Pradesh.



Weather:



Current conditions retrieved from API.



Forecast:



Rain expected.



Risk engine:



Disease risk increases.



Advisory:



"Monitor now. Avoid spraying before expected rainfall. Reassess during the next suitable weather window."



Show the complete journey visually.



---



# HACKATHON PRESENTATION MODE



Add a "Presentation Mode".



It should automatically demonstrate:



1. Farmer uploads image

2. AI scans leaf

3. 3D farm activates

4. Location appears

5. Weather loads

6. Disease is identified

7. Risk increases/decreases

8. Recommended action appears

9. Weather-safe action window appears



Use elegant animations.



The demo should take approximately 60–90 seconds.



---



# IMPORTANT SAFETY RULES



This is an agricultural decision-support system, not a replacement for an agricultural expert.



Never:



* invent disease diagnoses

* invent pesticide dosages

* claim certainty when confidence is low

* fabricate weather

* fabricate soil measurements

* fabricate model metrics

* fabricate sources



When uncertain:



Say so.



When the farmer's case requires professional confirmation:



Recommend consulting a local agricultural officer/agronomist.



---



# DEVELOPMENT PROCESS



Do the work in this order:



PHASE 1

Create project architecture.



PHASE 2

Create backend.



PHASE 3

Create weather/location integration.



PHASE 4

Create AI image diagnosis.



PHASE 5

Create disease-risk engine.



PHASE 6

Create 3D farm visualization.



PHASE 7

Create dashboard.



PHASE 8

Create history and alerts.



PHASE 9

Create Demo Mode.



PHASE 10

Test everything.



PHASE 11

Fix errors.



PHASE 12

Write README.



Do not stop after creating a plan.



Actually implement the project.



---



# FINAL REQUIREMENT



At the end, give me:



## 1. What you built



A concise summary.



## 2. File structure



Show the complete structure.



## 3. Installation



Give commands I can copy/paste.



## 4. Environment variables



Show `.env.example`.



## 5. Run commands



Give exact commands.



## 6. API setup



Explain exactly where I need API keys.



## 7. Demo



Tell me exactly how to demonstrate the project.



## 8. Known limitations



Be honest.



## 9. Next improvements



List the highest-value improvements.



Remember:



I am a beginner.



Do not assume I know how to debug.



If an error occurs, explain exactly what file to open and what to change.



The final product must look like a serious AI agriculture startup, not a college-level CRUD application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://samcropdis.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd04c7b5-fd16-4ee4-820d-34dd2c2607f7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
