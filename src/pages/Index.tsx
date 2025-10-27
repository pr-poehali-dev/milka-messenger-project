import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [statusProgress, setStatusProgress] = useState(0);

  const statuses = [
    { id: 1, name: 'Мой статус', avatar: '👤', time: 'Нажмите, чтобы добавить', isEmpty: true, stories: [] },
    { id: 2, name: 'Анна', avatar: '👩', time: 'Сегодня, 14:23', stories: [
      { id: 1, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', time: '14:23' },
      { id: 2, image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400', time: '15:10' }
    ]},
    { id: 3, name: 'Максим', avatar: '👨', time: 'Сегодня, 12:45', stories: [
      { id: 1, image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400', time: '12:45' }
    ]},
    { id: 4, name: 'Елена', avatar: '👩‍🦰', time: 'Вчера, 22:15', stories: [
      { id: 1, image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400', time: '22:15' }
    ]},
    { id: 5, name: 'Дмитрий', avatar: '🧑', time: 'Вчера, 19:30', stories: [
      { id: 1, image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400', time: '19:30' }
    ]},
  ];

  const chats = [
    { id: 1, name: 'Анна Петрова', avatar: '👩', lastMessage: 'Привет! Как дела?', time: '14:23', unread: 2 },
    { id: 2, name: 'Рабочая группа', avatar: '👥', lastMessage: 'Встреча в 15:00', time: '13:45', unread: 5 },
    { id: 3, name: 'Максим', avatar: '👨', lastMessage: 'Отправил файлы', time: '12:30', unread: 0 },
    { id: 4, name: 'Мама', avatar: '❤️', lastMessage: 'Приезжай в выходные', time: 'Вчера', unread: 0 },
  ];

  const channels = [
    { id: 1, name: 'Новости IT', avatar: '📱', subscribers: '12.5K', lastPost: '2 часа назад' },
    { id: 2, name: 'Дизайн и UX', avatar: '🎨', subscribers: '8.3K', lastPost: '5 часов назад' },
    { id: 3, name: 'Программирование', avatar: '💻', subscribers: '25K', lastPost: '1 час назад' },
  ];

  const calls = [
    { id: 1, name: 'Анна Петрова', avatar: '👩', type: 'incoming', time: 'Сегодня, 14:23', duration: '5:32' },
    { id: 2, name: 'Максим', avatar: '👨', type: 'outgoing', time: 'Сегодня, 12:15', duration: '2:10' },
    { id: 3, name: 'Рабочая группа', avatar: '👥', type: 'missed', time: 'Вчера, 18:45', duration: null },
  ];

  const contacts = [
    { id: 1, name: 'Анна Петрова', avatar: '👩', phone: '+7 900 123-45-67', online: true },
    { id: 2, name: 'Максим Иванов', avatar: '👨', phone: '+7 900 987-65-43', online: false },
    { id: 3, name: 'Елена Сидорова', avatar: '👩‍🦰', phone: '+7 900 555-55-55', online: true },
    { id: 4, name: 'Дмитрий Петров', avatar: '🧑', phone: '+7 900 111-22-33', online: false },
  ];

  const openStatus = (status: any) => {
    if (status.isEmpty) return;
    setSelectedStatus(status);
    setStatusProgress(0);
    
    const totalStories = status.stories.length;
    const progressPerStory = 100 / totalStories;
    let currentStory = 0;

    const interval = setInterval(() => {
      currentStory++;
      setStatusProgress(currentStory * progressPerStory);
      
      if (currentStory >= totalStories) {
        clearInterval(interval);
        setTimeout(() => setSelectedStatus(null), 300);
      }
    }, 3000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'statuses':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Статусы</h2>
              <div className="space-y-1">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    onClick={() => openStatus(status)}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className={`relative ${!status.isEmpty ? 'ring-2 ring-primary ring-offset-2 rounded-full' : ''}`}>
                      <Avatar className="w-14 h-14">
                        <AvatarFallback className="text-2xl">{status.avatar}</AvatarFallback>
                      </Avatar>
                      {status.isEmpty && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Icon name="Plus" size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{status.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{status.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'chats':
        return (
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div key={chat.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="text-xl">{chat.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">{chat.name}</p>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <Badge className="ml-2 bg-primary text-primary-foreground">{chat.unread}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'channels':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Мои каналы</h2>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-xl">{channel.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{channel.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {channel.subscribers} подписчиков • {channel.lastPost}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'calls':
        return (
          <div className="flex-1 overflow-y-auto">
            {calls.map((call) => (
              <div key={call.id} className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="text-xl">{call.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{call.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon 
                      name={call.type === 'incoming' ? 'PhoneIncoming' : call.type === 'outgoing' ? 'PhoneOutgoing' : 'PhoneMissed'} 
                      size={14}
                      className={call.type === 'missed' ? 'text-destructive' : ''}
                    />
                    <span>{call.time}</span>
                    {call.duration && <span>• {call.duration}</span>}
                  </div>
                </div>
                <Icon name="Phone" size={20} className="text-primary" />
              </div>
            ))}
          </div>
        );

      case 'contacts':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Контакты</h2>
              <div className="space-y-1">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-xl">{contact.avatar}</AvatarFallback>
                      </Avatar>
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{contact.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        {activeTab === 'chats' && (
          <div className="p-3 border-b">
            <Input 
              placeholder="Поиск..." 
              className="w-full"
              prefix={<Icon name="Search" size={16} />}
            />
          </div>
        )}
        
        {renderContent()}
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

      <Dialog open={!!selectedStatus} onOpenChange={() => setSelectedStatus(null)}>
        <DialogContent className="p-0 max-w-md h-[80vh] bg-black border-0">
          {selectedStatus && (
            <div className="relative h-full flex flex-col">
              <div className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="flex gap-1 mb-4">
                  {selectedStatus.stories.map((_: any, idx: number) => (
                    <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, (statusProgress - idx * (100 / selectedStatus.stories.length)) * selectedStatus.stories.length))}%` }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-2 ring-white">
                    <AvatarFallback>{selectedStatus.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-white">
                    <p className="font-medium">{selectedStatus.name}</p>
                    <p className="text-sm opacity-80">{selectedStatus.time}</p>
                  </div>
                  <Icon name="X" size={24} className="text-white cursor-pointer" onClick={() => setSelectedStatus(null)} />
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                {selectedStatus.stories[Math.floor(statusProgress / (100 / selectedStatus.stories.length))] && (
                  <img
                    src={selectedStatus.stories[Math.floor(statusProgress / (100 / selectedStatus.stories.length))].image}
                    alt="Status"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
