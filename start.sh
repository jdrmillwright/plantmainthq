#!/bin/sh
python3 engine.py
exec python3 -m http.server ${PORT:-8080} --directory public
