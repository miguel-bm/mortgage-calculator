run_local:
  poetry run uvicorn app.main:app --reload

export_requirements:
  poetry export --without-hashes --format=requirements.txt --output=requirements.txt