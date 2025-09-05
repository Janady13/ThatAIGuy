#!/usr/bin/env python3
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="static")

@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/backend")
def backend():
    return send_from_directory(app.static_folder, "backend.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == "__main__":
    import os
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", port=55888, debug=debug_mode)

