
import React, { useState, useEffect, useMemo } from 'react';
import { Room, Item, ActivityLog, PurchaseHistory, UserProfile } from './types';
import { PRESET_BLUEPRINTS } from './constants';
import MasterInventory from './MasterInventory';
import Header from './Header';
import ClinicMap from './ClinicMap';
import RoomModal from './RoomModal';
import LandingModal from './LandingModal';
import ProfilePage from './ProfilePage';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean>(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');

  const [isLocked, setIsLocked] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await bootstrapUser(data.session.user.id);
      } else {
        setBlueprint(PRESET_BLUEPRINTS[0].url);
      }
    };
    fetchSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        bootstrapUser(session.user.id);
      } else {
        setIsAuthenticated(false);
        setSupabaseUserId(null);
        setUser(null);
        setRooms([]);
        setHistory([]);
        setLogs([]);
        setBlueprint(PRESET_BLUEPRINTS[0].url);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const bootstrapUser = async (userId: string) => {
    setIsBootstrapped(false);
    setSupabaseUserId(userId);

    const { data: authUser } = await supabase.auth.getUser();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error', profileError);
    }

    let finalProfile = profile;
    if (!profile && authUser.user) {
      const fallbackProfile = {
        user_id: userId,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || 'User',
        account_type: (authUser.user.user_metadata?.account_type as any) || 'individual',
        phone: authUser.user.user_metadata?.phone || '',
        position: authUser.user.user_metadata?.position || '',
        company_name: authUser.user.user_metadata?.company_name || null
      };
      const { data: insertedProfile, error: insertProfileError } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (insertProfileError) {
        console.error('Profile upsert during bootstrap error', insertProfileError);
      } else {
        finalProfile = insertedProfile;
      }
    }

    if (finalProfile) {
      setUser({
        name: finalProfile.name || 'User',
        email: finalProfile.email,
        accountType: finalProfile.account_type,
        phone: finalProfile.phone || '',
        position: finalProfile.position || '',
        companyName: finalProfile.company_name || undefined
      });
    }

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventories')
      .select('id, data, blueprint')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inventoryError && inventoryError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Inventory fetch error', inventoryError);
    }

    if (inventory?.data) {
      if ((inventory as any).id) setInventoryId((inventory as any).id);
      const invData = (inventory as any).data || {};
      setRooms(invData.rooms || []);
      setHistory(invData.history || []);
      setLogs(invData.logs || []);
      setBlueprint(invData.blueprint || (inventory as any).blueprint || PRESET_BLUEPRINTS[0].url);
    } else {
      setRooms([]);
      setHistory([]);
      setLogs([]);
      setBlueprint(PRESET_BLUEPRINTS[0].url);
    }

    if (finalProfile) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsBootstrapped(true);
  };

  const handleLogin = async (userProfile: UserProfile) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;
    if (userId) setSupabaseUserId(userId);

    setUser(userProfile);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    if (userId) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        email: userProfile.email,
        name: userProfile.name,
        account_type: userProfile.accountType,
        phone: userProfile.phone,
        position: userProfile.position,
        company_name: userProfile.companyName
      });
      if (error) console.error('Profile upsert error', error);
      await bootstrapUser(userId);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsBootstrapped(false);
    setUser(null);
    setCurrentView('dashboard');
    setRooms([]);
    setHistory([]);
    setLogs([]);
    setInventoryId(null);
  };

  const addRoom = (x: number, y: number) => {
    const newRoom: Room = { id: Date.now(), name: `New Room`, x, y, items: [] };
    setRooms(prev => [...prev, newRoom]);
    setIsAddMode(false);
  };

  const deleteRoom = (id: number) => setRooms(prev => prev.filter(r => r.id !== id));
  
  const updateRoomName = (id: number, name: string) => 
    setRooms(prev => prev.map(r => r.id === id ? { ...r, name } : r));

  const addActivity = (roomId: number, roomName: string, action: ActivityLog['action'], details: string) => {
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      roomId,
      roomName,
      action,
      details
    };
    setLogs(prev => {
      if (prev.some(l => l.id === newLog.id)) return prev;
      return [newLog, ...prev].slice(0, 100);
    });
  };

  const receiveStock = (roomId: number, itemData: Partial<Item>, qty: number, price: number, expiry?: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const existingItem = room.items.find(i => 
        i.name.toLowerCase() === itemData.name?.toLowerCase() && 
        (itemData.brand ? i.brand.toLowerCase() === itemData.brand.toLowerCase() : true)
      );
      let updatedItems;
      if (existingItem) {
        const totalQty = existingItem.quantity + qty;
        const avgPrice = ((existingItem.quantity * existingItem.price) + (qty * price)) / totalQty;
        updatedItems = room.items.map(i => i.id === existingItem.id ? { ...i, quantity: totalQty, price: avgPrice, expiryDate: expiry || i.expiryDate } : i);
      } else {
        const newItem: Item = {
          id: Date.now(),
          name: itemData.name || '',
          brand: itemData.brand || '',
          code: itemData.code || '',
          quantity: qty,
          price: price,
          uom: itemData.uom || 'pcs',
          vendor: itemData.vendor || '',
          category: itemData.category || 'other',
          description: itemData.description || '',
          expiryDate: expiry
        };
        updatedItems = [...room.items, newItem];
      }
      addActivity(roomId, room.name, 'receive', `Received ${qty} ${itemData.uom || 'pcs'} of "${itemData.name}" [${itemData.code || 'N/A'}] @ $${price.toFixed(2)}`);
      
      const historyEntry: PurchaseHistory = {
        id: crypto.randomUUID() as any,
        timestamp: new Date().toISOString(),
        productName: itemData.name || '',
        brand: itemData.brand || '',
        code: itemData.code || '',
        vendor: itemData.vendor || '',
        qty,
        unitPrice: price,
        totalPrice: qty * price,
        location: room.name,
        category: itemData.category || 'other',
        roomId: room.id,
        expiryDate: expiry
      };
      setHistory(h => {
        const duplicate = h.some(
          entry =>
            entry.id === historyEntry.id ||
            (entry.productName === historyEntry.productName &&
              entry.roomId === historyEntry.roomId &&
              entry.qty === historyEntry.qty &&
              entry.unitPrice === historyEntry.unitPrice &&
              entry.timestamp === historyEntry.timestamp)
        );
        return duplicate ? h : [historyEntry, ...h];
      });
      return { ...room, items: updatedItems };
    }));
  };

  const updateItemQty = (roomId: number, itemId: number, delta: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        items: r.items.map(i => {
          if (i.id !== itemId) return i;
          const newQty = Math.max(0, i.quantity + delta);
          if (newQty !== i.quantity) {
             addActivity(roomId, r.name, 'edit', `Adjusted qty of "${i.name}" to ${newQty}`);
          }
          return { ...i, quantity: newQty };
        })
      };
    }));
  };

  const deleteItem = (roomId: number, itemId: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const item = r.items.find(i => i.id === itemId);
      const updated = r.items.filter(i => i.id !== itemId);
      if (item) {
        addActivity(roomId, r.name, 'delete', `Deleted "${item.name}"`);
      }
      return { ...r, items: updated };
    }));
  };

  const moveItem = (fromRoomId: number, toRoomId: number, itemId: number) => {
    const fromRoom = rooms.find(r => r.id === fromRoomId);
    const toRoom = rooms.find(r => r.id === toRoomId);
    const item = fromRoom?.items.find(i => i.id === itemId);
    if (!fromRoom || !toRoom || !item) return;

    setRooms(prev => prev.map(r => {
      if (r.id === fromRoomId) return { ...r, items: r.items.filter(i => i.id !== itemId) };
      if (r.id === toRoomId) return { ...r, items: [...r.items, item] };
      return r;
    }));
    addActivity(fromRoomId, fromRoom.name, 'transfer_out', `Transferred "${item.name}" to ${toRoom.name}`);
    addActivity(toRoomId, toRoom.name, 'transfer_in', `Received "${item.name}" from ${fromRoom.name}`);
  };

  const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId), [rooms, activeRoomId]);

  const userInitials = useMemo(() => {
    if (!user) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, [user]);

  useEffect(() => {
    const sync = async () => {
      const userId = supabaseUserId;
      if (!userId) return;
      const uniqueLogs = Array.from(new Map(logs.map(l => [l.id, l])).values());
      const uniqueHistory = Array.from(new Map(history.map(h => [h.id, h])).values());
      const payload = { rooms, history: uniqueHistory, logs: uniqueLogs, blueprint };
      const record: any = { user_id: userId, data: payload, blueprint };

      if (inventoryId) record.id = inventoryId;

      const { data, error } = await supabase
        .from('inventories')
        .upsert(record, { onConflict: 'user_id' })
        .select('id')
        .single();

      if (error) {
        console.error('Inventory upsert error', error);
      } else if (data?.id) {
        setInventoryId(data.id);
      }
    };
    if (isAuthenticated && isBootstrapped) {
      sync();
    }
  }, [rooms, history, logs, blueprint, isAuthenticated, isBootstrapped, supabaseUserId, inventoryId]);

  if (!isAuthenticated) {
    return <LandingModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col select-none bg-slate-50">
      <Header 
        onProfileClick={() => setCurrentView('profile')} 
        onDashboardClick={() => setCurrentView('dashboard')}
        userInitials={userInitials}
      />

      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-8 px-6 md:px-16 lg:px-32 py-8">
        <main className="flex-1 flex flex-col gap-8">
          {currentView === 'dashboard' ? (
            <>
              <ClinicMap 
                rooms={rooms}
                blueprint={blueprint}
                isLocked={isLocked}
                isAddMode={isAddMode}
                isDeleteMode={isDeleteMode}
                onSetLocked={setIsLocked}
                onSetAddMode={setIsAddMode}
                onSetDeleteMode={setIsDeleteMode}
                onAddRoom={addRoom}
                onDeleteRoom={deleteRoom}
                onSelectRoom={setActiveRoomId}
                onUpdateRooms={setRooms}
                onSelectTemplate={setBlueprint}
              />

              <MasterInventory 
                rooms={rooms} 
                history={history} 
                logs={logs}
                onReceive={receiveStock}
                onUpdateQty={updateItemQty}
                onTransfer={moveItem}
              />
            </>
          ) : (
            user && (
              <ProfilePage 
                user={user} 
                onLogout={handleLogout} 
                onBack={() => setCurrentView('dashboard')} 
              />
            )
          )}
        </main>
      </div>

      {activeRoomId && activeRoom && currentView === 'dashboard' && (
        <RoomModal 
          room={activeRoom} 
          allRooms={rooms}
          logs={logs.filter(l => l.roomId === activeRoomId)}
          onClose={() => setActiveRoomId(null)} 
          onUpdateName={updateRoomName}
          onReceive={receiveStock}
          onUpdateQty={updateItemQty}
          onTransfer={moveItem}
          onDeleteItem={deleteItem}
        />
      )}
    </div>
  );
};

export default App;
