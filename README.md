# friendstudy.ai

an ai study companion powered by an open-weight qwen model running locally through ollama.

https://friendstudy-ai-hf26-aoj3a8v43-ak-3e78.vercel.app/

## features

- adaptive ai study plan
- ask ai study companion
- ai quiz generator
- weak-subject prioritization
- exam countdown
- topic progress tracking
- editable subjects and study hours
- local browser persistence with localstorage
- responsive dashboard

## stack

- react + vite
- fastapi
- ollama
- qwen2.5:3b

## run backend

```text
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app
```

## run frontend

```text
cd frontend
npm install
npm run dev
```

open `http://localhost:5173`.

make sure ollama has the model:

```text
ollama pull qwen2.5:3b
```

## api

- `GET /api/health`
- `POST /api/ask`
- `POST /api/plan`
- `POST /api/quiz`
