// // src/services/socketService.test.ts
// import { SocketService } from '../../../services/socketService';
// import { Server, Socket } from 'socket.io';
// import { DefaultEventsMap } from 'socket.io/dist/typed-events'; // Utile per tipizzare Socket

// // Mock delle dipendenze
// import { mapMessageDAOToDTO, mapNotificationDAOToDTO } from '../../../services/mapperService';
// import { getUserIdByUsername } from '../../../controllers/userController';
// import { getOfficerIdByUsername } from '../../../controllers/adminController';
// import { Message } from '../../../models/Message';
// import { Notification } from '../../../models/Notification';

// // 1. Definiamo i mock qui, assicurandoci che il percorso sia corretto.
// // Nota: Ho rimosso l'alias '../src/' che era nel tuo esempio ma non necessario se i file sono in un'altra directory (es. 'src/tests/unit/services/').
// jest.mock('../../../services/mapperService', () => ({
//     mapMessageDAOToDTO: jest.fn((msg) => ({ content: msg.content, type: 'message_dto' })),
//     mapNotificationDAOToDTO: jest.fn((notif) => ({ content: notif.content, type: 'notification_dto' })),
// }));
// jest.mock('../../../controllers/userController', () => ({
//     getUserIdByUsername: jest.fn((username) => Promise.resolve(username === 'user1' ? 10 : 0)),
// }));
// jest.mock('../../../controllers/adminController', () => ({
//     getOfficerIdByUsername: jest.fn((username) => Promise.resolve(username === 'officer1' ? 20 : 0)),
// }));

// // --- CORREZIONE TS: Definiamo l'interfaccia custom MockSocket ---
// type SocketHandler = (...args: any[]) => void | Promise<void>;

// interface MockSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
//     // Aggiungiamo esplicitamente le proprietà custom che usiamo per catturare gli handler
//     onRegisterUserHandler: SocketHandler;
//     onRegisterOfficerHandler: SocketHandler;
//     onDisconnectHandler: SocketHandler; 
// }
// // --- FINE CORREZIONE TS ---


// describe('SocketService', () => {
//     let io: Server;
//     let service: SocketService;
//     let mockSocket: MockSocket; // Usiamo il nuovo tipo
//     let onConnectionHandler: (socket: Socket) => void;

//     // Funzione mock per un socket, ora con casting al tipo MockSocket
//     const createMockSocket = (id: string = 'mock_socket_id'): MockSocket => ({
//         id: id,
//         on: jest.fn(),
//         emit: jest.fn(),
//     } as unknown as MockSocket); // Cast esplicito a MockSocket

//     beforeEach(() => {
//         // Mock dell'istanza Server di socket.io
//         io = {
//             on: jest.fn((event, handler) => {
//                 if (event === 'connection') {
//                     onConnectionHandler = handler;
//                 }
//             }),
//             emit: jest.fn(),
//         } as unknown as Server;

//         // Inizializza il servizio, catturando l'handler di 'connection'
//         service = new SocketService(io);
        
//         // Simula la connessione di un socket
//         mockSocket = createMockSocket('S1');
//         onConnectionHandler(mockSocket);

//         // Alias per gli handler del mockSocket
//         (mockSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
//             // Assegniamo i mock handler alle nuove proprietà esplicite
//             if (event === 'registerUser') (mockSocket).onRegisterUserHandler = handler;
//             if (event === 'registerOfficer') (mockSocket).onRegisterOfficerHandler = handler;
//             if (event === 'disconnect') (mockSocket).onDisconnectHandler = handler;
//         });
        
//         // Reset dei mock per i metodi di mappatura
//         (mapMessageDAOToDTO as jest.Mock).mockClear();
//         (mapNotificationDAOToDTO as jest.Mock).mockClear();
//         // Aggiungo un reset dei mock dei controller per isolare meglio i test
//         (getUserIdByUsername as jest.Mock).mockClear(); 
//         (getOfficerIdByUsername as jest.Mock).mockClear(); 
//     });

//     it('should initialize and register the connection handler', () => {
//         expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
//     });

//     describe('Connection and Registration', () => {
//         it('should map a user ID to the socket upon registerUser event', async () => {
//             // Esecuzione dell'handler catturato usando la proprietà corretta
//             await mockSocket.onRegisterUserHandler('user1');
            
//             // L'ID 10 è l'ID di 'user1' moccato
//             const userSocketMap = (service as any).onlineUsers as Map<number, Socket>;
//             expect(userSocketMap.get(10)).toBe(mockSocket);
//             expect(getUserIdByUsername).toHaveBeenCalledWith('user1');
//         });

//         it('should map an officer ID to the socket upon registerOfficer event', async () => {
//             // Esecuzione dell'handler catturato usando la proprietà corretta
//             await mockSocket.onRegisterOfficerHandler('officer1');
            
//             // L'ID 20 è l'ID di 'officer1' moccato
//             const officerSocketMap = (service as any).onlineOfficers as Map<number, Socket>;
//             expect(officerSocketMap.get(20)).toBe(mockSocket);
//             expect(getOfficerIdByUsername).toHaveBeenCalledWith('officer1');
//         });
//     });

//     describe('Disconnection and Cleanup', () => {
//         let userSocket: MockSocket; // Usiamo il nuovo tipo
//         let officerSocket: MockSocket; // Usiamo il nuovo tipo

//         beforeEach(async () => {
//             // Connette e registra un utente e un officer con socket diversi
//             userSocket = createMockSocket('user_S2');
//             officerSocket = createMockSocket('officer_S3');
//             onConnectionHandler(userSocket);
//             onConnectionHandler(officerSocket);

//             // Cattura i nuovi handler
//             (userSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
//                 if (event === 'registerUser') userSocket.onRegisterUserHandler = handler;
//                 if (event === 'disconnect') userSocket.onDisconnectHandler = handler;
//             });
//             (officerSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
//                 if (event === 'registerOfficer') officerSocket.onRegisterOfficerHandler = handler;
//                 if (event === 'disconnect') officerSocket.onDisconnectHandler = handler;
//             });

//             await userSocket.onRegisterUserHandler('user1'); // ID 10
//             await officerSocket.onRegisterOfficerHandler('officer1'); // ID 20
//         });

//         it('should remove user from onlineUsers map on disconnect', () => {
//             expect((service as any).onlineUsers.has(10)).toBe(true);
//             userSocket.onDisconnectHandler(); // Usa la proprietà corretta
//             expect((service as any).onlineUsers.has(10)).toBe(false);
//             expect((service as any).onlineOfficers.has(20)).toBe(true);
//         });

//         it('should remove officer from onlineOfficers map on disconnect', () => {
//             expect((service as any).onlineOfficers.has(20)).toBe(true);
//             officerSocket.onDisconnectHandler(); // Usa la proprietà corretta
//             expect((service as any).onlineOfficers.has(20)).toBe(false);
//             expect((service as any).onlineUsers.has(10)).toBe(true);
//         });
//     });

//     describe('Emitting Messages and Notifications', () => {
//         let onlineSocket: MockSocket; // Usiamo il nuovo tipo
//         const ONLINE_USER_ID = 10;
//         const OFFLINE_USER_ID = 99;
//         const TEST_MESSAGE = { content: 'Test Message' } as unknown as Message;
//         const TEST_NOTIFICATION = { content: 'Test Notification' } as unknown as Notification;

//         beforeEach(async () => {
//             // Mock Socket online per ID 10
//             onlineSocket = createMockSocket('ONLINE_S');
//             onConnectionHandler(onlineSocket);
//             (onlineSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
//                 if (event === 'registerUser') onlineSocket.onRegisterUserHandler = handler;
//             });
            
//             await onlineSocket.onRegisterUserHandler('user1'); 
            
//             // Reset dei mock di emit
//             (onlineSocket.emit as jest.Mock).mockClear();
//         });

//         it('sendMessageToUser should emit to the correct user socket if online', () => {
//             service.sendMessageToUser(ONLINE_USER_ID, TEST_MESSAGE);

//             expect(mapMessageDAOToDTO).toHaveBeenCalledWith(TEST_MESSAGE);
//             expect(onlineSocket.emit).toHaveBeenCalledWith('newMessage', { content: 'Test Message', type: 'message_dto' });
//         });

//         it('sendMessageToUser should do nothing if user is offline', () => {
//             service.sendMessageToUser(OFFLINE_USER_ID, TEST_MESSAGE);

//             expect(onlineSocket.emit).not.toHaveBeenCalled();
//         });

//         it('sendNotificationToUser should emit to the correct user socket if online', () => {
//             service.sendNotificationToUser(ONLINE_USER_ID, TEST_NOTIFICATION);

//             expect(mapNotificationDAOToDTO).toHaveBeenCalledWith(TEST_NOTIFICATION);
//             expect(onlineSocket.emit).toHaveBeenCalledWith('newNotification', { content: 'Test Notification', type: 'notification_dto' });
//         });
        
//         it('sendMessageToOfficer should emit to the correct officer socket if online', async () => {
//             // Mock Socket online per ID 20 (officer1)
//             const officerSocket = createMockSocket('OFFICER_S');
//             onConnectionHandler(officerSocket);
//             (officerSocket.on as jest.Mock).mock.calls.forEach(([event, handler]) => {
//                  if (event === 'registerOfficer') officerSocket.onRegisterOfficerHandler = handler;
//             });
//             await officerSocket.onRegisterOfficerHandler('officer1'); 
//             (officerSocket.emit as jest.Mock).mockClear();


//             service.sendMessageToOfficer(20, TEST_MESSAGE);

//             expect(mapMessageDAOToDTO).toHaveBeenCalledWith(TEST_MESSAGE);
//             expect(officerSocket.emit).toHaveBeenCalledWith('newMessage', { content: 'Test Message', type: 'message_dto' });
//         });
//     });
// });