import os
from datetime import datetime, timezone
from functools import wraps # Import for our decorator
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv # Import for .env files

# --- App Configuration & Setup ---
load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app)

# Get the secret key from environment variables
SECRET_KEY = os.environ.get('SECRET_KEY')

basedir = os.path.abspath(os.path.dirname(__file__))
# ... (rest of the configuration is the same)
if 'RENDER' in os.environ:
    db_path = os.path.join(os.environ.get('RENDER_DISK_PATH', '/var/data'), 'app.db')
else:
    db_path = os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)


# --- SECURITY DECORATOR ---
# This is our "security guard" function
def require_secret_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check the 'Authorization' header for our secret key
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != f'Bearer {SECRET_KEY}':
            return jsonify({"error": "Unauthorized"}), 401 # Deny access
        return f(*args, **kwargs) # Allow access
    return decorated_function


# --- Database Models ---
class Task(db.Model):
    # ... (model is unchanged)
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    percentage = db.Column(db.Integer, default=0)
    due_date = db.Column(db.DateTime, nullable=True)
    type = db.Column(db.String(50), nullable=False, default='general')
    journal_entry_id = db.Column(db.Integer, db.ForeignKey('journal_entry.id'), nullable=True)
    journal_entry = db.relationship('JournalEntry', backref='tasks')

class JournalEntry(db.Model):
    # ... (model is unchanged)
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

# --- API ROUTES (Tasks) ---
@app.route("/api/tasks", methods=['GET'])
@require_secret_key # Place the guard in front of the door
def get_tasks():
    # ... (function content is unchanged)
    tasks_list = Task.query.order_by(Task.id).all()
    tasks_data = []
    for task in tasks_list:
        task_info = {
            "id": task.id, "text": task.text, "percentage": task.percentage,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "type": task.type, "journal_entry_id": task.journal_entry_id
        }
        if task.journal_entry:
            task_info['journal_entry_title'] = task.journal_entry.title
        tasks_data.append(task_info)
    return jsonify({"tasks": tasks_data})

@app.route("/api/tasks", methods=['POST'])
@require_secret_key # Place the guard here too
def add_task():
    # ... (function content is unchanged)
    task_data = request.get_json()
    due_date_str = task_data.get('due_date')
    due_date_obj = None
    if due_date_str:
        due_date_obj = datetime.fromisoformat(due_date_str).replace(tzinfo=timezone.utc)
    new_task = Task(
        text=task_data['text'], percentage=0, due_date=due_date_obj,
        type=task_data.get('type', 'general'),
        journal_entry_id=task_data.get('journal_entry_id')
    )
    db.session.add(new_task)
    db.session.commit()
    response_data = {
        "id": new_task.id, "text": new_task.text, "percentage": new_task.percentage,
        "due_date": new_task.due_date.isoformat() if new_task.due_date else None,
        "type": new_task.type, "journal_entry_id": new_task.journal_entry_id
    }
    if new_task.journal_entry:
        response_data['journal_entry_title'] = new_task.journal_entry.title
    return jsonify(response_data), 201

# --- Add @require_secret_key to ALL other routes ---

@app.route("/api/tasks/<int:task_id>", methods=['PUT'])
@require_secret_key
def update_task(task_id):
    # ... (function content is unchanged)
    task = db.session.get(Task, task_id)
    if task is None: return jsonify({"error": "Task not found"}), 404
    data = request.get_json()
    task.percentage = data.get('percentage', task.percentage)
    db.session.commit()
    response_data = {
        "id": task.id, "text": task.text, "percentage": task.percentage,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "type": task.type, "journal_entry_id": task.journal_entry_id
    }
    if task.journal_entry:
        response_data['journal_entry_title'] = task.journal_entry.title
    return jsonify(response_data)

@app.route("/api/tasks/<int:task_id>", methods=['DELETE'])
@require_secret_key
def delete_task(task_id):
    # ... (function content is unchanged)
    task = db.session.get(Task, task_id)
    if task is None: return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"result": "Task deleted"})

# ... (Do the same for all Journal routes)

@app.route("/api/journal", methods=['GET'])
@require_secret_key
def get_journal_entries():
    # ... (function content is unchanged)
    entries = JournalEntry.query.order_by(JournalEntry.created_at.desc()).all()
    entries_data = [{"id": entry.id, "title": entry.title, "content": entry.content, "created_at": entry.created_at.isoformat()} for entry in entries]
    return jsonify({"entries": entries_data})

@app.route("/api/journal", methods=['POST'])
@require_secret_key
def add_journal_entry():
    # ... (function content is unchanged)
    data = request.get_json()
    new_entry = JournalEntry(title=data['title'], content=data['content'])
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"id": new_entry.id, "title": new_entry.title, "content": new_entry.content, "created_at": new_entry.created_at.isoformat()}), 201

@app.route("/api/journal/<int:entry_id>", methods=['PUT'])
@require_secret_key
def update_journal_entry(entry_id):
    # ... (function content is unchanged)
    entry = db.session.get(JournalEntry, entry_id)
    if entry is None: return jsonify({"error": "Entry not found"}), 404
    data = request.get_json()
    entry.title = data.get('title', entry.title)
    entry.content = data.get('content', entry.content)
    db.session.commit()
    return jsonify({"id": entry.id, "title": entry.title, "content": entry.content, "created_at": entry.created_at.isoformat()})

@app.route("/api/journal/<int:entry_id>", methods=['DELETE'])
@require_secret_key
def delete_journal_entry(entry_id):
    # ... (function content is unchanged)
    entry = db.session.get(JournalEntry, entry_id)
    if entry is None: return jsonify({"error": "Entry not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"result": "Entry deleted"})