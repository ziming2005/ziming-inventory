
import React, { useState, useEffect, useMemo } from 'react';
import { Room, Item, ActivityLog, PurchaseHistory, UserProfile, ItemBatch } from './types';
import { PRESET_BLUEPRINTS } from './constants';
import MasterInventory from './MasterInventory';
import Header from './Header';
import ClinicMap from './ClinicMap';
import RoomModal from './RoomModal';
import LandingModal from './LandingModal';
import ProfilePage from './ProfilePage';
import AdminDashboard from './AdminDashboard';
import { supabase } from './supabaseClient';

type ManagedInventory = {
  userId: string;
  rooms: Room[];
  history: PurchaseHistory[];
  logs: ActivityLog[];
  blueprint?: string | null;
};

type ProfileRow = {
  user_id: string;
  email: string;
  name: string | null;
  account_type: string | null;
  phone?: string | null;
  position?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  background_url?: string | null;
};

const PROFILE_IMAGE_STORAGE_PREFIX = 'denta_profile_images_';
const PROFILE_IMAGE_BUCKET = 'profile-media';

const loadUserImages = (userId: string) => {
  try {
    const raw = localStorage.getItem(`${PROFILE_IMAGE_STORAGE_PREFIX}${userId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      avatarUrl: parsed.avatarUrl || undefined,
      backgroundUrl: parsed.backgroundUrl || undefined
    };
  } catch (err) {
    console.error('Failed to load profile images', err);
    return {};
  }
};

const persistUserImages = (userId: string, images: { avatarUrl?: string; backgroundUrl?: string }) => {
  try {
    const payload = {
      avatarUrl: images.avatarUrl || null,
      backgroundUrl: images.backgroundUrl || null
    };
    localStorage.setItem(`${PROFILE_IMAGE_STORAGE_PREFIX}${userId}`, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save profile images', err);
  }
};

const uploadProfileImage = async (file: File, userId: string, type: 'avatar' | 'background') => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `profiles/${userId}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const summarizeBatches = (batches: ItemBatch[]) => {
  const totalQty = batches.reduce((sum, b) => sum + b.qty, 0);
  const totalValue = batches.reduce((sum, b) => sum + (b.qty * b.unitPrice), 0);
  const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;
  const expiryTimes = batches
    .map(b => b.expiryDate ? new Date(b.expiryDate).getTime() : null)
    .filter((v): v is number => v !== null);
  const earliestExpiry = expiryTimes.length ? new Date(Math.min(...expiryTimes)).toISOString().split('T')[0] : null;
  return { totalQty, avgPrice, earliestExpiry };
};

const ensureBatches = (item: Item): Item => {
  const baseBatches = item.batches && item.batches.length > 0
    ? item.batches.map(b => ({ ...b }))
    : [{
        qty: item.quantity,
        unitPrice: item.price,
        expiryDate: item.expiryDate || null
      }];
  const { totalQty, avgPrice, earliestExpiry } = summarizeBatches(baseBatches);
  return {
    ...item,
    batches: baseBatches,
    quantity: totalQty,
    price: avgPrice,
    expiryDate: earliestExpiry
  };
};

const normalizeRooms = (rooms: Room[]) => rooms.map(room => ({
  ...room,
  items: room.items.map(ensureBatches)
}));

const mergeBatchAdd = (item: Item, qty: number, price: number, expiry?: string) => {
  const normalized = ensureBatches(item);
  const batches = normalized.batches ? [...normalized.batches] : [];
  const key = expiry || null;
  const idx = batches.findIndex(b => (b.expiryDate || null) === key);
  if (idx >= 0) {
    const b = batches[idx];
    const newQty = b.qty + qty;
    const newPrice = newQty > 0 ? ((b.qty * b.unitPrice) + (qty * price)) / newQty : price;
    batches[idx] = { ...b, qty: newQty, unitPrice: newPrice, expiryDate: key };
  } else {
    batches.push({ qty, unitPrice: price, expiryDate: key });
  }
  const { totalQty, avgPrice, earliestExpiry } = summarizeBatches(batches);
  return { ...normalized, batches, quantity: totalQty, price: avgPrice, expiryDate: earliestExpiry };
};

const adjustBatchesWithDelta = (item: Item, delta: number) => {
  const normalized = ensureBatches(item);
  let batches = normalized.batches ? normalized.batches.map(b => ({ ...b })) : [];
  if (delta > 0) {
    if (batches.length === 0) batches.push({ qty: 0, unitPrice: normalized.price, expiryDate: normalized.expiryDate || null });
    batches[0].qty += delta;
  } else if (delta < 0) {
    let remaining = Math.abs(delta);
    for (let i = batches.length - 1; i >= 0 && remaining > 0; i--) {
      const take = Math.min(batches[i].qty, remaining);
      batches[i].qty -= take;
      remaining -= take;
    }
    batches = batches.filter(b => b.qty > 0);
  }
  const { totalQty, avgPrice, earliestExpiry } = summarizeBatches(batches);
  return { ...normalized, batches, quantity: totalQty, price: avgPrice, expiryDate: earliestExpiry };
};

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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [managedProfiles, setManagedProfiles] = useState<ProfileRow[]>([]);
  const [managedInventories, setManagedInventories] = useState<ManagedInventory[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState<boolean>(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);
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
        setIsAdmin(false);
        setManagedProfiles([]);
        setManagedInventories([]);
        setAdminDataError(null);
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

  const fetchAdminData = async (force = false) => {
    if (!force && !isAdmin) return;
    setAdminDataLoading(true);
    setAdminDataError(null);
    try {
      const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
      if (profileError) {
        console.error('Admin profiles fetch error', profileError);
        setAdminDataError('Failed to load profiles. Please retry.');
      } else {
        setManagedProfiles(profiles || []);
      }

      const { data: inventories, error: inventoryError } = await supabase
        .from('inventories')
        .select('user_id, data, blueprint');
      if (inventoryError) {
        console.error('Admin inventory fetch error', inventoryError);
        setAdminDataError('Failed to load inventories. Please retry.');
      } else {
        const prepared: ManagedInventory[] = (inventories || []).map((inv: any) => ({
          userId: inv.user_id,
          rooms: inv.data?.rooms || [],
          history: inv.data?.history || [],
          logs: inv.data?.logs || [],
          blueprint: inv.data?.blueprint || inv.blueprint || PRESET_BLUEPRINTS[0].url
        }));
        setManagedInventories(prepared);
      }
    } finally {
      setAdminDataLoading(false);
    }
  };

  const bootstrapUser = async (userId: string) => {
    setIsBootstrapped(false);
    setSupabaseUserId(userId);

    const { data: authUser } = await supabase.auth.getUser();
    const storedImages = loadUserImages(userId);

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

    const accountTypeValue = (finalProfile?.account_type as any) || (authUser.user?.user_metadata?.account_type as any) || 'individual';
    const profileSource = finalProfile || (authUser.user ? {
      name: authUser.user.user_metadata?.name || authUser.user.email || 'User',
      email: authUser.user.email || '',
      phone: authUser.user.user_metadata?.phone || '',
      position: authUser.user.user_metadata?.position || '',
      companyName: authUser.user.user_metadata?.company_name || undefined
    } : null);

    if (profileSource) {
      setUser({
        name: profileSource.name || 'User',
        email: profileSource.email,
        accountType: accountTypeValue as any,
        phone: (profileSource as any).phone || '',
        position: (profileSource as any).position || '',
        companyName: (profileSource as any).companyName || (profileSource as any).company_name || undefined,
        avatarUrl: (profileSource as any).avatar_url || storedImages.avatarUrl,
        backgroundUrl: (profileSource as any).background_url || storedImages.backgroundUrl
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
      setRooms(normalizeRooms(invData.rooms || []));
      setHistory(invData.history || []);
      setLogs(invData.logs || []);
      setBlueprint(invData.blueprint || (inventory as any).blueprint || PRESET_BLUEPRINTS[0].url);
    } else {
      setRooms([]);
      setHistory([]);
      setLogs([]);
      setBlueprint(PRESET_BLUEPRINTS[0].url);
    }

    const isUserAdmin = accountTypeValue === 'admin';
    setIsAdmin(isUserAdmin);
    if (isUserAdmin) {
      await fetchAdminData(true);
    } else {
      setManagedProfiles([]);
      setManagedInventories([]);
    }

    setIsAuthenticated(!!authUser.user);
    setIsBootstrapped(true);
  };

  const handleLogin = async (userProfile: UserProfile) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;
    if (userId) setSupabaseUserId(userId);
    const storedImages = userId ? loadUserImages(userId) : {};

    setIsAdmin(userProfile.accountType === 'admin');
    setUser({ ...userProfile, ...storedImages });
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
        company_name: userProfile.companyName,
        avatar_url: storedImages.avatarUrl || null,
        background_url: storedImages.backgroundUrl || null
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
    setIsAdmin(false);
    setManagedProfiles([]);
    setManagedInventories([]);
    setAdminDataError(null);
    setAdminDataLoading(false);
    setCurrentView('dashboard');
    setRooms([]);
    setHistory([]);
    setLogs([]);
    setInventoryId(null);
  };

  const handleUpdateUserImages = async (payload: { type: 'avatar' | 'background'; file: File; previewUrl: string }) => {
    if (!supabaseUserId) throw new Error('User is not authenticated.');

    const nextAvatar = payload.type === 'avatar' ? payload.previewUrl : user?.avatarUrl;
    const nextBackground = payload.type === 'background' ? payload.previewUrl : user?.backgroundUrl;
    setUser(prev => prev ? { ...prev, avatarUrl: nextAvatar, backgroundUrl: nextBackground } : prev);

    const remoteUrl = await uploadProfileImage(payload.file, supabaseUserId, payload.type);
    const finalAvatar = payload.type === 'avatar' ? remoteUrl : (user?.avatarUrl || null);
    const finalBackground = payload.type === 'background' ? remoteUrl : (user?.backgroundUrl || null);

    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, avatarUrl: finalAvatar || undefined, backgroundUrl: finalBackground || undefined };
      persistUserImages(supabaseUserId, {
        avatarUrl: next.avatarUrl,
        backgroundUrl: next.backgroundUrl
      });
      return next;
    });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: finalAvatar,
        background_url: finalBackground
      })
      .eq('user_id', supabaseUserId);

    if (updateError) {
      console.error('Failed to update profile images, attempting upsert', updateError);
      const fallback = {
        user_id: supabaseUserId,
        email: user?.email || '',
        name: user?.name || '',
        account_type: user?.accountType || 'individual',
        phone: user?.phone || '',
        position: user?.position || '',
        company_name: user?.companyName || null,
        avatar_url: finalAvatar,
        background_url: finalBackground
      };
      const { error: upsertError } = await supabase.from('profiles').upsert(fallback, { onConflict: 'user_id' });
      if (upsertError) {
        console.error('Failed to persist profile images (upsert)', upsertError);
        throw upsertError;
      }
    }
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
    const timestamp = new Date().toISOString();
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      timestamp,
      roomId,
      roomName,
      action,
      details
    };
    setLogs(prev => {
      const isDuplicate = prev.some(l => 
        l.action === action &&
        l.roomId === roomId &&
        l.details === details &&
        Math.abs(new Date(l.timestamp).getTime() - new Date(timestamp).getTime()) < 1500 // within 1.5s
      );
      if (isDuplicate) return prev;
      return [newLog, ...prev].slice(0, 100);
    });
  };

  const receiveStock = (roomId: number, itemData: Partial<Item>, qty: number, price: number, purchaseDate: string, expiry?: string) => {
    setRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      const existingItem = room.items.find(i => 
        i.name.toLowerCase() === itemData.name?.toLowerCase() && 
        (itemData.brand ? i.brand.toLowerCase() === itemData.brand.toLowerCase() : true)
      );
      let updatedItems;
      if (existingItem) {
        const merged = mergeBatchAdd(existingItem, qty, price, expiry);
        updatedItems = room.items.map(i => i.id === existingItem.id ? merged : i);
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
          expiryDate: expiry || null,
          batches: [{
            qty,
            unitPrice: price,
            expiryDate: expiry || null
          }]
        };
        updatedItems = [...room.items, newItem];
      }
      addActivity(roomId, room.name, 'receive', `Received ${qty} ${itemData.uom || 'pcs'} of "${itemData.name}" [${itemData.code || 'N/A'}] @ $${price.toFixed(2)}`);
      
      const historyTimestamp = purchaseDate ? new Date(`${purchaseDate}T00:00:00`).toISOString() : new Date().toISOString();
      const historyEntry: PurchaseHistory = {
        id: crypto.randomUUID() as any,
        timestamp: historyTimestamp,
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
        uom: itemData.uom || existingItem?.uom || 'pcs',
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
          const adjusted = adjustBatchesWithDelta(i, delta);
          if (adjusted.quantity !== i.quantity) {
             addActivity(roomId, r.name, 'edit', `Adjusted qty of "${i.name}" to ${adjusted.quantity}`);
          }
          return adjusted;
        })
      };
    }));
  };

  const updateItemBatchQty = (roomId: number, itemId: number, batchIndex: number, delta: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        items: r.items.map(i => {
          if (i.id !== itemId) return i;
          const normalized = ensureBatches(i);
          const batches = normalized.batches ? normalized.batches.map(b => ({ ...b })) : [];
          if (batchIndex < 0 || batchIndex >= batches.length) return normalized;
          const b = batches[batchIndex];
          const newQty = Math.max(0, b.qty + delta);
          batches[batchIndex] = { ...b, qty: newQty };
          const filtered = batches.filter(x => x.qty > 0);
          const { totalQty, avgPrice, earliestExpiry } = summarizeBatches(filtered);
          const adjusted = { ...normalized, batches: filtered, quantity: totalQty, price: avgPrice, expiryDate: earliestExpiry };
          if (adjusted.quantity !== i.quantity) {
            addActivity(roomId, r.name, 'edit', `Adjusted batch qty of "${i.name}" to ${adjusted.quantity}`);
          }
          return adjusted;
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
      if (isAdmin) return;
      sync();
    }
  }, [rooms, history, logs, blueprint, isAuthenticated, isBootstrapped, supabaseUserId, inventoryId, isAdmin]);

  const adminRooms = useMemo(() => managedInventories.flatMap((inv) => inv.rooms || []), [managedInventories]);
  const adminHistory = useMemo(() => managedInventories.flatMap((inv) => inv.history || []), [managedInventories]);

  if (!isAuthenticated) {
    return <LandingModal onLogin={handleLogin} />;
  }

  if (isAuthenticated && isAdmin && user) {
    return (
      <AdminDashboard 
        user={user} 
        rooms={adminRooms} 
        history={adminHistory} 
        onLogout={handleLogout} 
        onSwitchToClinic={() => {}} 
        managedProfiles={managedProfiles}
        managedInventories={managedInventories}
        adminLoading={adminDataLoading}
        adminError={adminDataError}
        onRefreshAdminData={() => fetchAdminData(true)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col select-none bg-slate-50">
      <Header 
        onProfileClick={() => setCurrentView('profile')} 
        onDashboardClick={() => setCurrentView('dashboard')}
        userInitials={userInitials}
        userAvatarUrl={user?.avatarUrl}
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
                onUpdateImages={handleUpdateUserImages}
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
          onUpdateBatchQty={updateItemBatchQty}
          onTransfer={moveItem}
          onDeleteItem={deleteItem}
        />
      )}
    </div>
  );
};

export default App;
