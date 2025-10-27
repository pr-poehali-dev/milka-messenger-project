'''
Business: Регистрация и аутентификация пользователей по номеру телефона
Args: event с httpMethod, body (phone, name, avatar)
Returns: HTTP response с токеном сессии или ошибкой
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import uuid
import hashlib
from datetime import datetime, timedelta

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def generate_session_token(phone: str) -> str:
    timestamp = datetime.now().isoformat()
    data = f"{phone}{timestamp}{uuid.uuid4()}"
    return hashlib.sha256(data.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            if action == 'register':
                phone = body_data.get('phone', '').strip()
                name = body_data.get('name', '').strip()
                avatar = body_data.get('avatar', '👤')
                
                if not phone or not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Phone and name are required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT id, phone, name, avatar FROM users WHERE phone = %s",
                    (phone,)
                )
                existing_user = cur.fetchone()
                
                if existing_user:
                    session_token = generate_session_token(phone)
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'message': 'User already exists',
                            'user': dict(existing_user),
                            'session_token': session_token
                        }),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO users (phone, name, avatar, is_online) VALUES (%s, %s, %s, true) RETURNING id, phone, name, avatar",
                    (phone, name, avatar)
                )
                new_user = cur.fetchone()
                conn.commit()
                
                session_token = generate_session_token(phone)
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'User registered successfully',
                        'user': dict(new_user),
                        'session_token': session_token
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                phone = body_data.get('phone', '').strip()
                
                if not phone:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Phone is required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT id, phone, name, avatar FROM users WHERE phone = %s",
                    (phone,)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = %s",
                    (user['id'],)
                )
                conn.commit()
                
                session_token = generate_session_token(phone)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Login successful',
                        'user': dict(user),
                        'session_token': session_token
                    }),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
                
        finally:
            cur.close()
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
