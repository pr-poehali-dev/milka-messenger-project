'''
Business: Получение списка чатов пользователя и создание новых чатов
Args: event с httpMethod, headers (X-User-Id), queryStringParameters (user_id)
Returns: HTTP response со списком чатов или результатом создания
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required in X-User-Id header'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            query = f"""
                SELECT DISTINCT
                    c.id,
                    c.type,
                    c.name,
                    c.avatar,
                    CASE 
                        WHEN c.type = 'private' THEN (
                            SELECT users.name FROM users
                            JOIN chat_members ON chat_members.user_id = users.id
                            WHERE chat_members.chat_id = c.id AND users.id != {user_id}
                            LIMIT 1
                        )
                        ELSE c.name
                    END as display_name,
                    CASE 
                        WHEN c.type = 'private' THEN (
                            SELECT users.avatar FROM users
                            JOIN chat_members ON chat_members.user_id = users.id
                            WHERE chat_members.chat_id = c.id AND users.id != {user_id}
                            LIMIT 1
                        )
                        ELSE c.avatar
                    END as display_avatar,
                    (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != {user_id} AND is_read = false) as unread_count
                FROM chats c
                JOIN chat_members cm ON cm.chat_id = c.id
                WHERE cm.user_id = {user_id}
                ORDER BY last_message_time DESC NULLS LAST
            """
            
            cur.execute(query)
            chats = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'chats': [dict(chat) for chat in chats]}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            chat_type = body_data.get('type', 'private')
            other_user_id = body_data.get('other_user_id')
            name = body_data.get('name', '').replace("'", "''")
            avatar = body_data.get('avatar', '👥').replace("'", "''")
            
            if chat_type == 'private' and other_user_id:
                check_query = f"""
                    SELECT c.id FROM chats c
                    JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = {user_id}
                    JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = {other_user_id}
                    WHERE c.type = 'private'
                    LIMIT 1
                """
                
                cur.execute(check_query)
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'chat_id': existing_chat['id'], 'message': 'Chat already exists'}),
                        'isBase64Encoded': False
                    }
            
            insert_query = f"""
                INSERT INTO chats (type, name, avatar, created_by) 
                VALUES ('{chat_type}', {f"'{name}'" if name else 'NULL'}, '{avatar}', {user_id}) 
                RETURNING id
            """
            
            cur.execute(insert_query)
            new_chat = cur.fetchone()
            chat_id = new_chat['id']
            
            cur.execute(f"INSERT INTO chat_members (chat_id, user_id, role) VALUES ({chat_id}, {user_id}, 'admin')")
            
            if chat_type == 'private' and other_user_id:
                cur.execute(f"INSERT INTO chat_members (chat_id, user_id) VALUES ({chat_id}, {other_user_id})")
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'chat_id': chat_id, 'message': 'Chat created successfully'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    finally:
        cur.close()
        conn.close()
