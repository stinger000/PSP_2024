
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)


class Session(db.Model):
    __tablename__ = 'session'
    session_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    token = db.Column(db.String(255), nullable=False)
    lifetime = db.Column(db.DateTime, nullable=False)

    user = db.relationship('User', backref=db.backref('sessions', lazy=True))


class Programs(db.Model):
    __tablename__ = 'programs'
    program_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    program_name = db.Column(db.String(255), nullable=False)
    program_text = db.Column(db.Text, nullable=False)

    user = db.relationship('User', backref=db.backref('programs', lazy=True))
