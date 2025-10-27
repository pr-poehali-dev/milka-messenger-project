'''
Business: Отправка и получение сообщений в чатах
Args: event с httpMethod, headers (X-User-Id), queryStringParameters (chat_id), body (chat_id, content)
Returns: HTTP response со списком сообщений или результатом отправки
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
            params = event.get('queryStringParameters', {}) or {}
            chat_id = params.get('chat_id')
            
            if not chat_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'chat_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT 
                    m.id,
                    m.content,
                    m.type,
                    m.sender_id,
                    m.is_read,
                    m.created_at,
                    u.name as sender_name,
                    u.avatar as sender_avatar
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.chat_id = %s
                ORDER BY m.created_at ASC
            """, (chat_id,))
            
            messages = cur.fetchall()
            
            cur.execute("""
                UPDATE messages 
                SET is_read = true 
                WHERE chat_id = %s AND sender_id != %s AND is_read = false
            """, (chat_id, user_id))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': [dict(msg) for msg in messages]}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('chat_id')
            content = body_data.get('content', '').strip()
            msg_type = body_data.get('type', 'text')
            
            if not chat_id or not content:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'chat_id and content are required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO messages (chat_id, sender_id, content, type) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (chat_id, user_id, content, msg_type)
            )
            new_message = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'Message sent successfully',
                    'id': new_message['id'],
                    'created_at': str(new_message['created_at'])
                }),
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
