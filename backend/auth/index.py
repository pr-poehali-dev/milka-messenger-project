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
from datetime import datetime

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
                phone = body_data.get('phone', '').strip().replace("'", "''")
                name = body_data.get('name', '').strip().replace("'", "''")
                avatar = body_data.get('avatar', '👤').replace("'", "''")
                
                if not phone or not name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Phone and name are required'}),
                        'isBase64Encoded': False
                    }
                
                check_query = f"SELECT id, phone, name, avatar FROM users WHERE phone = '{phone}'"
                cur.execute(check_query)
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
                
                insert_query = f"""
                    INSERT INTO users (phone, name, avatar, is_online) 
                    VALUES ('{phone}', '{name}', '{avatar}', true) 
                    RETURNING id, phone, name, avatar
                """
                
                cur.execute(insert_query)
                new_user = cur.fetchone()
                new_user_id = new_user['id']
                
                existing_users_query = f"SELECT id FROM users WHERE id != {new_user_id} LIMIT 3"
                cur.execute(existing_users_query)
                existing_users = cur.fetchall()
                
                for existing_user in existing_users:
                    check_chat_query = f"""
                        SELECT c.id FROM chats c
                        JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = {new_user_id}
                        JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = {existing_user['id']}
                        WHERE c.type = 'private'
                        LIMIT 1
                    """
                    cur.execute(check_chat_query)
                    existing_chat = cur.fetchone()
                    
                    if not existing_chat:
                        create_chat_query = f"INSERT INTO chats (type, created_by) VALUES ('private', {new_user_id}) RETURNING id"
                        cur.execute(create_chat_query)
                        new_chat = cur.fetchone()
                        chat_id = new_chat['id']
                        
                        cur.execute(f"INSERT INTO chat_members (chat_id, user_id, role) VALUES ({chat_id}, {new_user_id}, 'admin')")
                        cur.execute(f"INSERT INTO chat_members (chat_id, user_id) VALUES ({chat_id}, {existing_user['id']})")
                
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
                phone = body_data.get('phone', '').strip().replace("'", "''")
                
                if not phone:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Phone is required'}),
                        'isBase64Encoded': False
                    }
                
                select_query = f"SELECT id, phone, name, avatar FROM users WHERE phone = '{phone}'"
                cur.execute(select_query)
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                update_query = f"UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = {user['id']}"
                cur.execute(update_query)
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