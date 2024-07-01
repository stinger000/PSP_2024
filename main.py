import uuid
from datetime import datetime, timedelta

from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from flask import jsonify
import logging
import json

from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from models import db, User, Session, Programs

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config.from_object(Config)
db.init_app(app)
with app.app_context():
    db.create_all()


def validate_token(username, token):
    user = User.query.filter_by(username=username).first()
    if not user:
        return False

    session = Session.query.filter_by(user_id=user.user_id, token=token).first()
    if session and session.lifetime > datetime.utcnow():
        return True

    return False


def extend_token(username, token):
    user = User.query.filter_by(username=username).first()
    if not user:
        return False

    session = Session.query.filter_by(user_id=user.user_id, token=token).first()
    if session and session.lifetime > datetime.utcnow():
        session.lifetime = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        return True

    return False


@app.route('/', methods=['GET', 'POST'])
def index():
    return send_from_directory(app.root_path + '/WWW', 'index.html')


@app.route('/<path:path>')
def send_static(path):
    return send_from_directory(app.root_path + '/WWW', path)


@app.route('/check', methods=['POST'])
def check():
    print("check request")
    username = request.json.get('username')
    token = request.json.get('token')
    print(username, token)
    if res := validate_token(username, token):
        extend_token(username, token)
    return jsonify({'result': res})


@app.route('/save', methods=['POST'])
def save_program():
    print("save request")
    data = request.get_json()
    username = data.get('username')
    token = data.get('token')
    prog_name = data.get('prog_name')
    prog_text = data.get('prog_text')

    if not all([username, token, prog_name, prog_text]):
        return jsonify({'error': 'All fields are required'}), 400

    if validate_token(username, token):
        extend_token(username, token)

        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        program = Programs.query.filter_by(user_id=user.user_id, program_name=prog_name).first()
        if program:
            program.program_text = prog_text  # Update existing program
        else:
            new_program = Programs(user_id=user.user_id, program_name=prog_name, program_text=prog_text)
            db.session.add(new_program)  # Add new program

        db.session.commit()
        return jsonify({'result': True}), 200

    return jsonify({'error': 'Invalid token'}), 401


@app.route('/load', methods=['POST'])
def load_programs():
    print("load request")
    data = request.get_json()
    username = data.get('username')
    token = data.get('token')

    if not all([username, token]):
        return jsonify({'error': 'Username and token are required'}), 400

    if validate_token(username, token):
        user = User.query.filter_by(username=username).first()
        programs = Programs.query.filter_by(user_id=user.user_id).all()

        response = {
            "result": True,
            "count": len(programs),
            "progs": [{"name": program.program_name, "text": program.program_text} for program in programs]
        }

        return jsonify(response), 200

    return jsonify({'error': 'Invalid token'}), 401


@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'result': False, 'error': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'result': False, 'error': 'User already exists'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'result': True, 'message': 'User created successfully'}), 201


@app.route('/auth', methods=['POST'])
def auth():
    json_data = request.get_json()
    username = json_data.get('username')
    password = json_data.get('password')
    print("new auth request")
    print(f"{username} {password}")
    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        token = str(uuid.uuid4())
        lifetime = datetime.utcnow() + timedelta(hours=1)

        session = Session.query.filter_by(user_id=user.user_id).first()
        if session:
            session.token = token
            session.lifetime = lifetime
        else:
            new_session = Session(user_id=user.user_id, token=token, lifetime=lifetime)
            db.session.add(new_session)

        db.session.commit()

        return jsonify({'token': token}), 200

    return jsonify({'error': 'Invalid username or password'}), 401


if __name__ == '__main__':
    app.run(debug=True)
