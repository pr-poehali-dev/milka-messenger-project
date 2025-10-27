import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/01063afc-d30a-46fc-be35-f5feda0c68e5',
  chats: 'https://functions.poehali.dev/e33096ce-f821-4fc8-9cb8-f1b6e143da58',
  messages: 'https://functions.poehali.dev/442ae68d-b96f-4add-846d-4b1480dc071d'
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('session_token');
    if (user && token) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
      loadChats(JSON.parse(user).id);
    }
  }, []);

  const handleRegister = async () => {
    if (!phone || !name) {
      toast({ title: 'Ошибка', description: 'Введите телефон и имя', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', phone, name, avatar: '👤' })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('session_token', data.session_token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        loadChats(data.user.id);
        toast({ title: 'Успешно!', description: 'Вы вошли в Милку' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось войти', variant: 'destructive' });
    }
  };

  const loadChats = async (userId: number) => {
    try {
      const response = await fetch(API_URLS.chats, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`${API_URLS.messages}?chat_id=${chatId}`, {
        headers: { 'X-User-Id': currentUser.id.toString() }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await fetch(API_URLS.messages, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          chat_id: selectedChat.id,
          content: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(selectedChat.id);
        loadChats(currentUser.id);
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    }
  };

  const openChat = (chat: any) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatChatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background font-['Roboto']">
        <div className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-6xl mb-4">💬</div>
            <h1 className="text-3xl font-bold text-primary">Милка</h1>
            <p className="text-muted-foreground">Ваш мессенджер для общения</p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="+7 900 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-lg"
            />
            <Input
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg"
            />
            <Button onClick={handleRegister} className="w-full text-lg py-6">
              Войти в Милку
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            При входе вы автоматически регистрируетесь по номеру телефона
          </p>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="h-screen flex flex-col bg-background font-['Roboto']">
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3 shadow-md">
          <Icon 
            name="ArrowLeft" 
            size={24} 
            className="cursor-pointer" 
            onClick={() => setSelectedChat(null)}
          />
          <Avatar className="w-10 h-10">
            <AvatarFallback className="text-lg">{selectedChat.display_avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{selectedChat.display_name}</p>
            <p className="text-xs opacity-80">онлайн</p>
          </div>
          <Icon name="Phone" size={20} className="cursor-pointer" />
          <Icon name="Video" size={20} className="cursor-pointer" />
          <Icon name="MoreVertical" size={20} className="cursor-pointer" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender_id === currentUser.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border'
                }`}
              >
                {msg.sender_id !== currentUser.id && selectedChat.type === 'group' && (
                  <p className="text-xs font-semibold text-accent mb-1">{msg.sender_name}</p>
                )}
                <p className="break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-3 bg-background">
          <div className="flex items-center gap-2">
            <Icon name="Smile" size={24} className="text-muted-foreground cursor-pointer" />
            <Input
              placeholder="Сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            {newMessage.trim() ? (
              <Button onClick={sendMessage} size="icon" className="rounded-full">
                <Icon name="Send" size={20} />
              </Button>
            ) : (
              <Icon name="Mic" size={24} className="text-muted-foreground cursor-pointer" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background font-['Roboto']">
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-semibold">Милка</h1>
        <div className="flex items-center gap-3">
          <Icon name="Search" size={20} className="cursor-pointer" />
          <Icon name="MoreVertical" size={20} className="cursor-pointer" />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chats' && chats.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl font-semibold mb-2">Нет чатов</p>
              <p className="text-muted-foreground">Начните общение с контактов</p>
            </div>
          </div>
        )}

        {activeTab === 'chats' && chats.length > 0 && (
          <>
            <div className="p-3 border-b">
              <Input placeholder="Поиск..." className="w-full" />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <div 
                  key={chat.id} 
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b"
                  onClick={() => openChat(chat)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="text-xl">{chat.display_avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{chat.display_name}</p>
                      <span className="text-xs text-muted-foreground">{formatChatTime(chat.last_message_time)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{chat.last_message || 'Нет сообщений'}</p>
                      {chat.unread_count > 0 && (
                        <Badge className="ml-2 bg-primary text-primary-foreground">{chat.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab !== 'chats' && (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="text-6xl mb-4">
                {activeTab === 'statuses' && '📸'}
                {activeTab === 'channels' && '📢'}
                {activeTab === 'calls' && '📞'}
                {activeTab === 'contacts' && '👥'}
              </div>
              <p className="text-xl font-semibold mb-2">
                {activeTab === 'statuses' && 'Статусы'}
                {activeTab === 'channels' && 'Каналы'}
                {activeTab === 'calls' && 'Звонки'}
                {activeTab === 'contacts' && 'Контакты'}
              </p>
              <p className="text-muted-foreground">Скоро появятся</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-background">
        <div className="flex items-center justify-around p-2">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
              activeTab === 'chats' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="MessageCircle" size={24} />
            <span className="text-xs">Чаты</span>
          </button>
          
          <button
            onClick={() => setActiveTab('statuses')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
              activeTab === 'statuses' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Radio" size={24} />
            <span className="text-xs">Статусы</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
              activeTab === 'channels' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Megaphone" size={24} />
            <span className="text-xs">Каналы</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
              activeTab === 'calls' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Phone" size={24} />
            <span className="text-xs">Звонки</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 transition-colors ${
              activeTab === 'contacts' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Users" size={24} />
            <span className="text-xs">Контакты</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
